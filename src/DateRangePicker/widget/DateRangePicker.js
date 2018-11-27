/*
    Custom Mendix Widget
    "DateRangePicker"
    Apache License 2.0
	Copyright 2018 Bizzomate (Bart Rikers)
*/
define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dijit/_TemplatedMixin",
    "mxui/dom",
	"dojo/dom-class",
    "dojo/on",
    "dojo/dom-construct",
    "dojo/html",
	"dojo/query",
    "dojo/text!DateRangePicker/widget/template/DateRangePicker.html",
    "DateRangePicker/lib/jquery-1.12.4",
	"DateRangePicker/lib/moment",
	"DateRangePicker/lib/daterangepicker-3.0.3"

], function(declare, _WidgetBase, _TemplatedMixin, dom, domClass, dojoOn, dojoConstruct, dojoHtml, dojoQuery, widgetTemplate, $) {
    "use strict";

    return declare("DateRangePicker.widget.DateRangePicker", [
        _WidgetBase,
        _TemplatedMixin
    ], {
        // _TemplatedMixin will create our dom node using this HTML template.
        templateString: widgetTemplate,

        // Parameters configured in the Modeler.
        iconTooltip: "",
        placeholderText: "",

		useCustomDateFormat: false,
		customDateFormat: "",
		showWeekNumbers: false,
		showTimePicker: false,
		show24HourTimePicker: false,
		timePickerIncrement: 0,
		
        onChangeMicroflow: "",
        onChangeMicroflowProgress: "",
        onChangeMicroflowProgressMsg: "",
        onChangeMicroflowAsync: "",


		/* Label options */
		labelCaption: "",
        labelWidth: "",
        displayEnum: "",

        // Internal variables. Non-primitives created in the prototype are shared between all widget instances.
        _handle: null,
        _alertDiv: null,
        _contextObj: null,
        _dateRangePicker: null,
        _dateRangePickerButton: null,
        _params: null,
        _readOnly: false,
		_initialStartDate: null, 
		_initialEndDate: null,
		_startDate: null, //holds the current selected start date, used to check if the selection has changed
		_endDate: null, // holds the current selected end date, used to check if the selection has changed
		_hasSelectedDateRange: false,

        // dijit._WidgetBase.postCreate is called after constructing the widget. Implement to do extra setup work.
        postCreate: function postCreate() {
            logger.debug(this.id + ".postCreate");

            if (this.readOnly || this.get("disabled") || this.readonly) {
                this._readOnly = true;
            }

            this._dateRangePickerButton = $(this.domNode)
                .find("button.mx-dateinput-select-button")
                .first()
                .get(0);
            $(this._dateRangePickerButton).attr("title", this.iconTooltip);

            this._dateRangePicker = $(this.domNode)
                .find("input.mx-dateinput-input")
                .first()
                .get(0);

            this._setParams();
			
			//init daterange picker
			 $(this._dateRangePicker).daterangepicker(this.params);
			
			var drpData = $(this._dateRangePicker).data('daterangepicker');
			
			//set initial start and end date, to be used for clearing the calendar
			this._initialStartDate = drpData.startDate;
			this._initialEndDate = drpData.endDate;
			this._startDate = this._initialStartDate;
			this._endDate = this._initialEndDate;
			
			var self = this;
			 //set Clear event
			 $(this._dateRangePicker).on('cancel.daterangepicker', function(ev, picker) {
				//reset initial dates
				picker.setStartDate(self._initialStartDate);
				picker.setEndDate(self._initialEndDate);
				self._startDate = self._initialStartDate;
				self._endDate = self._initialEndDate;
				
				self._hasSelectedDateRange = false;
				
				//reset attributes
				$(this).val('');
				self._contextObj.set(self.startDateAttribute, "");
				self._contextObj.set(self.endDateAttribute, "");
				if (self.onChangeMicroflow.length > 0) {
                    self._runMicroflow(self._contextObj, self.onChangeMicroflow);
                }
			});
			
			//set onChange event
			$(this._dateRangePicker).on('hide.daterangepicker', function(ev, picker) {
				//determine if selected range has changed
				var hasChanged = picker.startDate._d.getTime() !== self._startDate._d.getTime() || picker.endDate._d.getTime() !== self._endDate._d.getTime();
				if (hasChanged) {
					self._hasSelectedDateRange = true;
					self._startDate = picker.startDate;
					self._endDate = picker.endDate;
					dojoOn.emit(this, "change", {
						bubbles: false,
						cancelable: true
					});
				} else {
					if (!self._hasSelectedDateRange) {
						//undo auto update input field
						$(this).val('');
					}
				}
			});
			
			//Set placeholderText
			var defaultPlaceholderText = '';
			if (this.placeholderText && this.placeholderText.trim().length) {
				defaultPlaceholderText = this.placeholderText;
			} else {
				if (this.useCustomDateFormat && this.customDateFormat.trim().length) {
					defaultPlaceholderText = this.customDateFormat + ' - ' + this.customDateFormat;
				} else {
						defaultPlaceholderText = 'MM/DD/YYYY - MM/DD/YYYY';
				}
			}
			
			$(this._dateRangePicker).attr("placeholder", defaultPlaceholderText);

			// Set label
			if (this.labelCaption && this.labelCaption.trim().length) {
                this.inputLabel.innerHTML = this.labelCaption;
            } else {
                dojoConstruct.destroy(this.inputLabel);
            }

            if (this.displayEnum === "horizontal") {
                domClass.add(this.inputLabel, "col-sm-" + this.labelWidth);
                domClass.add(this.inputWrapper, "col-sm-" + (12 - this.labelWidth));
            }

            this._setupEvents();
        },

        // mxui.widget._WidgetBase.update is called when context is changed or initialized. Implement to re-render and / or fetch data.
        update: function update(obj, callback) {
            logger.debug(this.id + ".update");
            this._contextObj = obj;
            this._updateDateRangePicker(this._dateRangePicker, obj.get(this.startDateAttribute), obj.get(this.endDateAttribute));
            this._resetSubscriptions();
            callback();
        },

        // mxui.widget._WidgetBase.uninitialize is called when the widget is destroyed. Implement to do special tear-down work.
        uninitialize: function uninitialize() {
            logger.debug(this.id + ".uninitialize");
            if (this._handle) {
                this.unsubscribe(this._handle);
                this._handle = null;
            }
        },

        _triggerFocus: function _triggerFocus(element) {
            logger.debug(this.id + "._triggerFocus");
            $(element).trigger("focus");
        },

        _setParams: function _setParams() {
            logger.debug(this.id + "._setParams");
			var params = {
				showWeekNumbers: this.showWeekNumbers,
				timePicker: this.showTimePicker,
				timePicker24Hour: this.show24HourTimePicker,
				timePickerIncrement: this.timePickerIncrement,
				locale: {
					cancelLabel: 'Clear'
				}
            };
			
			if (this.useCustomDateFormat) {
				params.locale.format = this.customDateFormat;	
			}
			
            this.params = params;
        },

        _updateDateRangePicker: function _updateDateRangePicker(element, startDate, endDate) {
            
			logger.debug(this.id + "._updateDateRangePicker");
            if (startDate && endDate) {
                var startDateObject = new Date(startDate);
				var endDateObject = new Date(endDate);
				var drpData = $(element).data('daterangepicker');
				drpData.setStartDate(startDateObject);
				drpData.setEndDate(endDateObject);
            } else {
				$(element).val('');
				this._contextObj.set(this.startDateAttribute, "");
				this._contextObj.set(this.endDateAttribute, "");
			}
        },

        _onChange: function _onChange(dateRangePickerElement) {
            logger.debug(this.id + "._onChange");
			this._clearValidations();
			var drp = $(dateRangePickerElement).data('daterangepicker');
			var startDate = drp.startDate;
			var endDate = drp.endDate;
			
			//set attributes
			if (startDate && endDate) {
				this._contextObj.set(this.startDateAttribute, startDate);
				this._contextObj.set(this.endDateAttribute, endDate);
                if (this.onChangeMicroflow.length > 0) {
                    this._runMicroflow(this._contextObj, this.onChangeMicroflow);
                }
				
			} else {
				this._contextObj.set(this.startDateAttribute, "");
				this._contextObj.set(this.endDateAttribute, "");
			}
        },

        _addValidation: function _addValidation(message) {
            logger.debug(this.id + "._showValidation");
            if (this._alertDiv !== null) {
                dojoHtml.set(this._alertDiv, message);
                return;
            }
            this._alertDiv = dojoConstruct.create("div", {
                class: "alert alert-danger",
                innerHTML: message
            });
			var targetNode = dojoQuery('.mx-dateinput', this.domNode)[0];
			if (targetNode){
				dojo.addClass(targetNode, 'has-error');
				dojoConstruct.place(this._alertDiv, targetNode);
			}
        },

        _clearValidations: function _clearValidations() {
            logger.debug(this.id + "._clearValidations");
            dojoConstruct.destroy(this._alertDiv);
			var targetNode = dojoQuery('.has-error', this.domNode)[0];
            if (targetNode) {
				dojo.removeClass(targetNode, 'has-error');
			}
            this._alertDiv = null;
        },

        _handleValidation: function _handleValidation(validations) {
            logger.debug(this.id + "._handleValidation");
            this._clearValidations();

			var validation = validations[0],
                startDateMessage = validation.getReasonByAttribute(this.startDateAttribute);
				endDateMessage = validation.getReasonByAttribute(this.endDateAttribute);

            if (this._readOnly) {
                validation.removeAttribute(this.startDateAttribute);
				validation.removeAttribute(this.endDateAttribute);
            } else if (startDateMessage || endDateMessage) {
                if (startDateMessage){
					this._addValidation(startDateMessage);
					validation.removeAttribute(this.startDateAttribute);
				}
				
				if (endDateMessage){
					this._addValidation(endDateMessage);
					validation.removeAttribute(this.endDateAttribute);
				}
            }
        },

        _setupEvents: function _setupEvents() {
			this.connect(this._dateRangePickerButton, "click", this._triggerFocus.bind(this, this._dateRangePicker));
			this.connect(this._dateRangePicker, "change", this._onChange.bind(this, this._dateRangePicker));
        },

        _handleObjectSubscription: function(guid) {
			var obj = this._contextObj;
            this._updateDateRangePicker(this._dateRangePicker, obj.get(this.startDateAttribute), obj.get(this.endDateAttribute));
        },

        _handleAttrSubscription: function(guid, attr, value) {
			var obj = this._contextObj;
			var startDate = obj.get(this.startDateAttribute);
			var endDate = obj.get(this.endDateAttribute);
			if (startDate && endDate) {
				var obj = this._contextObj;
				this._updateDateRangePicker(this._dateRangePicker, obj.get(this.startDateAttribute), obj.get(this.endDateAttribute));
			}
        },

        _resetSubscriptions: function _resetSubscriptions() {
            // Release handles on previous object, if any.
            this.unsubscribeAll();
            // Assign new handles if an object exists.
            if (this._contextObj) {
                this.subscribe({
                    guid: this._contextObj.getGuid(),
                    callback: this._handleObjectSubscription.bind(this)
                });
                this.subscribe({
                    guid: this._contextObj.getGuid(),
                    attr: this.startDateAttribute,
                    callback: this._handleAttrSubscription.bind(this)
                });
				this.subscribe({
                    guid: this._contextObj.getGuid(),
                    attr: this.endDateAttribute,
                    callback: this._handleAttrSubscription.bind(this)
                });
                this.subscribe({
                    guid: this._contextObj.getGuid(),
                    val: true,
                    callback: this._handleValidation.bind(this)
                });
            }
        },

        _runMicroflow: function _runMicroflow(obj, mf, cb) {
            if (mf) {
                var parameters = {
                    origin: this.mxform,
                    params: {
                        actionname: mf,
                        applyto: "selection",
                        guids: []
                    },
                    callback: function(objects) {
                        if (cb) {
                            cb(objects);
                        }
                    },
                    error: function error(errorObject) {
                        if (cb) {
                            cb();
                        }
                        /*
                            When used asynchronous the feedback validations are causing an call to this error function.
                            We don't need this behaviour in this widget since validations are already handled.
                        */
                        if (errorObject.message.indexOf("validation error") === -1) {
                            mx.ui.error("Error executing microflow " + mf + " : " + errorObject.message);
                        }
                    }
                };
                if (this.onChangeMicroflowProgress === true) {
                    parameters.progress = "modal";
                }
                if (this.onChangeMicroflowProgressMsg !== "") {
                    parameters.progressMsg = this.onChangeMicroflowProgressMsg;
                }
                if (this.onChangeMicroflowAsync === true) {
                    parameters.async = this.onChangeMicroflowAsync;
                }
                if (obj) {
                    parameters.params.guids = [ obj.getGuid() ];
                }
                mx.ui.action(mf, parameters, this);
            } else if (cb) {
                cb();
            }
        }
    });
});
require([ "DateRangePicker/widget/DateRangePicker" ]);
