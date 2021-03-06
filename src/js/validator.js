/** 
 * validator - Form validation with jQuery
 * 
 * @author Nate Johnson
 * @version 0.2.0
 * @license Released under the MIT license
 */


(function($) {
	'use strict';
	
	var _this,
		rules = {
			phone : {
				msg : 'Phone number is invalid.',
				rule : '^(([0-9]{1})*[- .(]*([0-9]{3})[- .)]*[0-9]{3}[- .]*[0-9]{4})+$'
			},
			email : {
				msg : 'Email address is invalid.',
				rule : '^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$'
			},
			url : {
				msg : 'URL is invalid.',
				rule : "(http|ftp|https)://[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:/~+#-]*[\w@?^=%&amp;/~+#-])?"
			},
			zip : {
				msg : 'Zip code is invalid.',
				rule : '^[0-9]{5}(?:-[0-9]{4})?$'
			},
			password : {
				msg : 'Password is invalid.',
				rule : "(?=^.{6,}$)((?=.*[A-Za-z0-9])(?=.*[A-Z])(?=.*[a-z]))^.*"
			},
			digits : {
				msg : 'Digits are invalid.',
				rule : '^[0-9]+$'
			},
			ssn : {
				msg : 'Social Security Number is invalid.',
				rule : '/^([0-9]{3}[-]*[0-9]{2}[-]*[0-9]{4})*$/'
			}
		};

	// plugin implementation
	$.fn.extend({
		validator : function(options) {
			_this = this;
			_this.hasValidated = _this.hasValidated || false;
			
			if (typeof options === 'object' || typeof options === 'undefined') {
				
				// default options
				var defaults = {
					mode : 'prod',
					submit : true,
					before : null,
					after : null,
					success : null,
					error : null,
					rules : null,
          novalidate: true
				};

				// implement user options				
				_this.options = $.extend(defaults, options);
				
				/**
				 * Embed options as element data to:
				 * 1. Preserves options for API calls
				 * 2. Denotes element as active validator participant
				 */
				$(this).data('validator', this.options);

				// plug-in magic below
				return this.each(function() {
					if (_this.options.novalidate) {
            $(this).attr("novalidate", "novalidate");
          }

					$(this).on('submit', function(ev) {
						if (!_this.options.submit) {
							ev.preventDefault();
						}
						
						_this.validate($(this));
					});
				});
			} else {
				// API methods
				switch (options) {
					case 'validate':
						return _this.validate(this);

					case 'errors':
						return _this.getErrors(this);
				}
			}
		},
		/**
		 * Return validation status.
		 * 
		 * @return {Boolean} validity status 
		 */
		isValid : function () {
			if (typeof this.errors === 'undefined') {
				this.validate($(this));
			}
			
			return (_this.errors.length <= 0);
		},
		/**
		 * Return validation errors.
		 * 
		 * @return {Array} errors 
		 */
		getErrors : function () {
			if (!_this.hasValidated) {
				if (_this.options.mode === 'dev') {
					console.warn('Errors method referenced before any validation.  Validation invoked for accuracy.');
				}
				_this.validate(this);
			}
			
			return _this.errors;
		},
		/**
		 * Validates the element
		 *
		 * @param {Object} element Target DOM element  
		 */
		validate : function (element) {
			
			// invoke 'before' callback
			if (typeof _this.options !== 'undefined') {
				if (typeof _this.options.before !== 'undefined' && typeof _this.options.before === 'function') {
					_this.options.before.call(_this);
				}
			}
				
			_this.hasValidated = true;
			_this.errors = [];
			_this.warnings = [];
			_this.options = _this.options || element.data('validator');
			
			// add empty options warning
			if (!_this.options) {
				_this.warnings.push('No validator options.');
			}
			
			// iterate over all validator input fields
			element.find('[data-validator]').each(function(i, el) {
				var directives = $(el).attr('data-validator').split(' ');
				el.isRequired = false;
				
				// validate required fields
				if (directives.indexOf('required') >= 0) {
					el.isRequired = true;
					
					if (!isValidValue(el)) {
						_this.errors.push({
							msg : 'Required field',
							el : el
						});
					}
				}
				
				// validate field types
				$.each(directives, function(i, r) {
					// skip required validation, already prioritized
					if (r !== 'required') {
						var textRange = /text\[([0-9]+),([0-9]+)\]/;
						if (textRange.test(r)) {
							var m = textRange.exec(r),
								val = $(el).val();
							
							if (val.length < m[1] || val.length > m[2]) {
								_this.errors.push({
									msg : ''.concat('Invalid text range: ', (val.length < m[1]) ? 'too short [min. ' + m[1] + '].' : 'too long. [max. ' + m[2] + ']'),
									el : el
								});
							}
							
						} else if ((el.isRequired && !isValidType(r, el)) || 
							(isValidValue(el) && !isValidType(r, el))) { 
							_this.errors.push({
								msg : (typeof _this.options !== 'undefined' && typeof _this.options.rules !== 'undefined') ? _this.options.rules[r] || rules[r].msg : rules[r].msg,
								el : el
							});
						}
					}
				});
				
			});

			// invoke callbacks
			if (typeof _this.options !== 'undefined') {
				if (_this.errors.length && typeof _this.options.error !== 'undefined' && typeof _this.options.error === 'function') {
					_this.options.error.call(_this, _this.errors);
					
				} else if (typeof _this.options.success !== 'undefined' && typeof _this.options.success === 'function') {
					_this.options.success.call(_this);
				}
			}
			return this;
		}
	});
	
	/**
	 * Value validation.
	 * 
	 * @param {Object} el Input field
	 * 
	 * @return {Boolean} validity status
	 */
	var isValidValue = function (el) {
		var retval = true;
		
		if ($(el).attr('type') === 'checkbox' || $(el).attr('type') === 'radio') {
			var hasChecked = false;
			$(_this).find('[name=' + $(el).attr('name') + ']').each(function(i, el) {
				if (!hasChecked && $(el).is(':checked')) {
					hasChecked = true;
				}
			});
			
			if (!hasChecked) {
				retval = false;
			}
		} else if ($(el).val() === '') {
			retval = false;
		}
		return retval;
	};
	
	/**
	 * Type validation.
	 * 
	 * @param {Object} type Input type
	 * @param {Object} el Input field
	 * 
	 * @return {Boolean} validity status
	 */
	var isValidType = function (type, el) {
		var retval = true,
      rule;
		
		// evaluate custom rule
		if (typeof _this.options !== 'undefined' && 
			typeof _this.options.rules !== 'undefined' && 
			typeof _this.options.rules[type] !== 'undefined') {
			if (typeof _this.options.rules[type].rule === 'function') {
				retval = _this.options.rules[type].rule.call(_this, $(el).val());
			} else {
				rule = new RegExp(_this.options.rules[type].rule);
				retval = rule.test($(el).val());
			}
			
			_this.options.rules[type].msg = _this.options.rules[type].msg || 'Invalid field.';
		
		// evaluate native rule
		} else if (typeof rules[type] !== 'undefined') {
			rule = new RegExp(rules[type].rule);
			retval = rule.test($(el).val());
			
		// warn unsupported rule
		} else {
			console.warn('Unsupported rule type: ', type);
		}
			
		return retval;
	};

})(jQuery);
