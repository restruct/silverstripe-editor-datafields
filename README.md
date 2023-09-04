TinyMCE plugin to have placeholder contents in TinyMCE live-update based on external data (static/live, eg dropdowns with options).

[examples are SilverStripe specific, but editor plugin just depends on TinyMCE v3 or v4]
[datafields.js + HtmlEditorConfigHelper updated & working in SilverStripe 4 as well]

Markers/placeholders can be defined in editor config:
```php
HtmlEditorConfig::get('statusupdates')->setOption( 'datafields',
    array(
		array( 'field' => 'Contact.FirstName', 'text' => 'Voornaam ontvanger', 'value' => 'Voornaam (ontv.)' ),
		array( 'field' => 'Contact.FullName', 'text' => 'Naam ontvanger', 'value' => 'Naam Ontvanger (volledig)' ),
		array( 'field' => 'Sender.FullName', 'text' => 'Naam afzender', 'value' => 'Naam Afzender' ),
		...
    ));
```

Static fields get their content from a json array attribute on the editor field (data-datafields-static-tokenvalues).
The array should have field-value pairs ( [{"field":"Contact.FirstName","value":"Voornaam (ontv.)"},{"field":... )
```php
...
        // build static fields json [{"field":"Contact.FirstName","value":"Voornaam (ontv.)"},{"field":...
        if($staticFields && $currRec) {
            $json_part_template = '';
            foreach ($staticFields as $staticField) {
                $json_part_template .=
                    '<% if $' . $staticField['field'] . ' %>{"field":"' . $staticField['field'] . '","value":"{$' . $staticField['field'] . '}"},<% end_if %>';
            }
            $json_part_rendered = $currRec->renderWith( SSViewer::fromString($json_part_template) );
            $staticFieldsJson = '[' . rtrim($json_part_rendered,',') . ']';
        }
        // set static fields json on editor
        if($emailField && $staticFieldsJson) $emailField->setAttribute('data-datafields-static-tokenvalues', $staticFieldsJson);
        if($letterField && $staticFieldsJson) $letterField->setAttribute('data-datafields-static-tokenvalues', $staticFieldsJson);
```

Dynamic fields are live-updated. They are listening to, and get their content from the value an `<input>` or `<select>`.  
The array should have field-inputname pairs ( `[{"field":"Contact.FirstName","value":"Voornaam (ontv.)"},{"field":...` )

```php
...
        //
        // and some dynamic datafields values
        //
        // build json [{"field":"Contact.FirstName","inputname":"name"}, ...
        $dynamicFieldsJson = json_encode(
            array(
                array( 'field' => 'Sender.FullName', 'inputname' => 'Update_Sender' ),
                array( 'field' => 'Person.FullName', 'inputname' => 'Appointment_Person' ),
                array( 'field' => 'Location.Full', 'inputname' => 'Appointment_Location' ),
                array( 'field' => 'DateFormatted', 'inputname' => 'Appointment_Date' ),
                array( 'field' => 'Time.Nice24', 'inputname' => 'Appointment_Time' ),
                array( 'field' => 'EndTime.Nice24', 'inputname' => 'Appointment_EndTime' ),
            )
        );
        // set dynamic fields json on editor
        if($emailField && $dynamicFieldsJson) $emailField->setAttribute('data-datafields-dynamic-tokenvalues', $dynamicFieldsJson);
        if($letterField && $dynamicFieldsJson) $letterField->setAttribute('data-datafields-dynamic-tokenvalues', $dynamicFieldsJson);
//        $emailfield->setAttribute('data-datafields-dynamic-tokenvalueselectors',
```

Dynamic field-values can optionally be translated/mapped from a json array on the specific input (`data-datafields-dynamic-displayvaluemap`).
This way, for example a short description can be shown in the dropdow (eg 'Location Amsterdam'), while a longer (even multi-line) value can be inserted in the editor (eg the full location address spanning multiple lines).

```
    $someDropdownField->setAttribute('data-datafields-dynamic-displayvaluemap', json_encode($reasons->map('ID','FullAddress')->toArray()))
```
