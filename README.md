# DateRangePicker
An implementation of Dann Grossman's DateRangePicker (http://www.daterangepicker.com). 

Some key-features:
- select a range of dates by using the daterange picker
- select time using a timepicker
- set custom date/time format
- set a custom placeholder text

See https://daterangepicker.mxapps.io for a demo.

## Installation
Add the widget to a dataview and select a start datetime and end datetime attribute.

## Configuration
  #### General
  _Begin date (Attribute)_: The DateTime attribute in which the begin date of the selected range is stored
  
  _End date (Attribute)_: The DateTime attribute in which the end date of the selected range is stored

  #### Date Picker options
  _Use custom date format_: indicates whether or not to use a custom date format
  _Custom date format_: set a custom date format to be used, e.g. MM/DD/YYYY or DD-MM-YYYY. If timepicker is enabled, the time format can also be included, e.g. MM/DD/YYYY h:mm A or DD-MM-YYYY HH:mm
  _Show Timepicker_: Allow selection of dates with times, not just dates. If you want the time to be shown, a custom date format is required
  _Show 24-hour timepicker_: Use 24-hour time picker instead of 12-hour times, removing the AM/PM selection
  _Timepicker increment_: Increment of the minutes selection list for times (i.e. 30 to allow only selection of times ending in 0 or 30)
  _Show weeknumbers_: Show localized week numbers at the start of each week on the calendars
  
  #### Display
  _Icon tooltip_: Set a tooltip on the calendar icon
  
  _Placeholder text_: Set a custom placeholder text. If left empty, the date/time format will be shown as placeholder
  
  _Label_: The label to show on the form. Leave empty for no label
  
  _Label width_: Width of the label. Only applicable for horizontal display
  
  _Label display_: Horizontal (next to the input) or verticel (above the input)
  
  #### Behaviour
  Set optional on-click microflow

## Known bugs
None
