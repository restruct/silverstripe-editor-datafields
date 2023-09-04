/**
 TinyMCE datafields_editorplugin (for SilverStripe)
 license: http://www.opensource.org/licenses/mit-license.php

 A replaceable datafields (tokens) plugin for TinyMCE (4).
 Tokens act as placeholders for object datafields, eg a recipient's name, or a dropdown's value.

 TineMCE 'data_fields' should be declared as an array of objects.
 Each object can have the following properties:
 field	The field name/value (eg '$Recipient.Fullname')
 text	[optional] The name of this field in the insert-dropdown (eg 'Recipient name')
 value	[optional] The default text of the inserted token (eg 'John Doe')
 */

// General plugin definition object/methods
var datafields_editorplugin = {

    editor : null,
    //$self : null,
    $form : null,

    info : {
        longname : 'Datafields',
        author : 'Restruct',
        authorurl : 'http://restruct.nl',
        infourl : 'http://restruct.nl/',
        version : "2.0"
    },

    // tokens
    tokens : [],
    tokenDropdownItems : [],
    dynamicTokenMap : [],

    init : function(editor){

        // save some references
        var self = this;
        this.editor = editor;

        // Get TOKENS / prepare the menu list to be used in addButton() and addMenuItem()
        if(jQuery && jQuery(editor.getElement()).data('datafields')){ // if jQuery && datafields attribute
            this.tokens = jQuery(editor.getElement()).data('datafields'); // get tokens from data-attribute
        } else { // else: get tokens from general config
            this.tokens = editor.getParam('datafields',[]);
        }
        // console.log(this.tokens);

        // Some fixing & add to dropdown array
        for(var i=this.tokens.length-1; i>=0; i--) {
            //if a title / value was not set then set a default one
            if(this.tokens[i].text == undefined) this.tokens[i].text = this.tokens[i].field.replace('$','');
            if(this.tokens[i].value == undefined) this.tokens[i].value = this.tokens[i].text;
        }

        // update token-values with static-values if defined: array( array('field' => [token-field], 'value' => 'fixed-value'), array( ...
        if(jQuery && jQuery(editor.getElement()).data('datafields-static-tokenvalues')) {
            var statVals = jQuery(editor.getElement()).data('datafields-static-tokenvalues');
            for(var j in statVals){
                for(i in this.tokens){
                    if(this.tokens[i].field == statVals[j].field ) { //&& statVals[j].field!=''
                        this.tokens[i].value = statVals[j].value;
                    }
                }
            }
        }

        // listen to changes on external dropdowns & fields, and update token values accordingly (dynamic token values)
        // array( array('field' => [token-field], 'inputname' => [field-name] ), array( ...
        if(jQuery && jQuery(editor.getElement()).data('datafields-dynamic-tokenvalues')) {
            this.dynamicTokenMap = jQuery(editor.getElement()).data('datafields-dynamic-tokenvalues');

            // set field mapping and listener on input elements
            for(i in this.dynamicTokenMap){
                // set some config
                var $input = jQuery('[name="'+ this.dynamicTokenMap[i].inputname +'"] , [name="'+ this.dynamicTokenMap[i].inputname +'Visible"]'); // 'Visible' gets added for datepickers
                $input.data('datafields-dynamic-maptotoken', this.dynamicTokenMap[i].field);
                $input.data('datafields-dynamic-displaykey', (this.dynamicTokenMap[i].getvaluefrom || false));

                // set listener (blur = for datepicker)
                $input.on('change blur', function(e){
                    // use timeout for datepicker, as we have no events to subscribe to and blur happens before date update... (Grm&%$#!)
                    if(jQuery(this).hasClass('hasDatepicker')){
                        // console.log('datepicker-timeout');
                        window.setTimeout(function () {
                            self.updateDynamicValues();
                            self.refreshEditorContents();
                        }, 500);
                    } else {
                        self.updateDynamicValues();
                        self.refreshEditorContents();
                    }
                });
            }
            //
            jQuery('[data-onchangenotify]').each(function(){
                jQuery(this).on('change blur', function(){
                    jQuery( '[name=' + jQuery(this).data('onchangenotify') +']').trigger('change');
                });
            });
            // and updates once on init
            this.updateDynamicValues();
        }

        // add some styling
        editor.contentStyles
            .push('strong[data-datafield], span[data-datafield] { ' +
                    'user-select: none;' +
                    'background-color: rgb(255,235,60); ' +
                    'background-color: rgba(255,235,60,.5); ' +
                    'border-radius: 4px; ' +
                    'padding: 1px 1px; border: 1px dashed #EFDB3B; ' +
                    'margin-right: 2px; ' +
                    '}' +
                // data-mce-selected works only in TinyMCE4+(?)
                  'strong[data-datafield][data-mce-selected]:before, span[data-datafield][data-mce-selected]:before {' +
                    'content: "double-click to edit (will not be auto-updated anymore)";' +
                    'position: absolute;' +
                    'background-color: rgb(255,235,60); ' +
                    'background-color: grey;' +
                    'border: 1px solid grey;' +
                    'color: white;' +
                    'margin-left: 4px;' +
                    'margin-top: 4px;' +
                    'border-radius: 4px;' +
                    'padding: 2px 4px;' +
                  '}');

        //
        // Process events when live datafields might have to become editable (on clicking them twice)
        // on mouseup, keyup, keydown, click
        if(editor.on) { // (only for newer TinyMCEs)
            editor.on('dblclick', function (e) {
                // var isDataFieldAndSelected = ( jQuery(e.target).data('datafield') );
                // console.log(jQuery(e.target).data('mce-selected'));
                if (jQuery(e.target).data('datafield')) {
                    var make_editable = confirm("Are you sure you want to make this text editable? " +
                        "(It will no longer be auto-updated/replaced with content)");
                    if (make_editable == true) {
                        jQuery(e.target).replaceWith(jQuery(e.target).html());
                    }
                }
            });
            // @TODO: make the editable-dialog & functionality work as well when pressing backspace right before the non-editable object
            // editor.on('keydown', function(e) {
            //     // detecting backspace or delete keypresses
            //     if(e.keyCode == 46 || e.keyCode==8)
            //         console.log(e.target);
            // });
        }

    },

    // dynamicTokenMap contains a list mapping tokens (in-content) to inputnames, like { field:"Correspondence_Sender.Name", inputname:"Correspondence_SenderID" }
    updateDynamicValues: function(){
        // var $el = jQuery(input);
        // // find token to map this input's value to
        // if(!mapToToken) mapToToken = $el.data('datafields-dynamic-maptotoken');
        // // if not set, try & get value to display from element
        // if(!textOrVal) textOrVal = $el.data('datafields-dynamic-textorval');
        // if(!textOrVal) textOrVal = 'val'; // falback to val
        // var FormVals = this.$form.serialize();
// console.log(this.dynamicTokenMap);
        // loop over all dynamic inputs:
        for(var j in this.dynamicTokenMap){
            var $dynInput = jQuery('[name="'+ this.dynamicTokenMap[j].inputname +'"]');
// console.log(this.dynamicTokenMap[j].inputname);
            if($dynInput.length){ // if input found in dynamicTokenMap

                // update token value
                for(var i in this.tokens){ // find token

                    if(this.tokens[i].field == $dynInput.data('datafields-dynamic-maptotoken')) {
                        // console.log(this.tokens[i].field);
                        // get input value element (switch per input type and property to display)
                        var value = '';
                        var displayvaluemap = null;
                        // @TODO: handle checkboxes/multi selects and radios
                        if ($dynInput.is('select')) {
                            // display selected TEXT value for selects
                            value = $dynInput.find('option:selected').text();
                            // or get value from json map on selector
                            if ($dynInput.data('datafields-dynamic-displayvaluemap')) {
                                displayvaluemap = $dynInput.data('datafields-dynamic-displayvaluemap');
                                value = displayvaluemap[$dynInput.find('option:selected').val()];
                                // additional option: get value from different field for selected option;
                                // console.log(value);
                                if(value && value.substring(0, 14) == '#altFieldName#'){
                                    // console.log('[name="'+ value.replace('#altFieldName#','') +'"]');
                                    var $altField = jQuery('[name="'+ value.replace('#altFieldName#','') +'"]');
                                    if($altField.length){ value = $altField.val(); }
                                }
                            }
                        } else { // Appointment_Date
                            value = $dynInput.val();
                            // may be a datepicker (extra listener on the 'originalName+Visible' field setup around line 76)
                            if($dynInput.datepicker){
                                // value = $dynInput.datepicker("getDate"); // gets UTF string
                                // get 'Visible' input's data for datepicker (.hasDatepicker only gets applied after the first time the datepicker was opened)
                                var visibleInput = jQuery('input.date[name=' + $dynInput.attr('name') + 'Visible]');
                                if(visibleInput.length){
                                    value = visibleInput.val();
                                }
                            }
                            // or get value from json map on input (eg on autocomplete fields)
                            if ($dynInput.data('datafields-dynamic-displayvaluemap')) {
                                displayvaluemap = $dynInput.data('datafields-dynamic-displayvaluemap');
                                value = displayvaluemap[value]; // @TODO: weird re-assigning of 'value' going on here?
                            }
                        }

                        // and set for token
                        if(!value) { value = '&nbsp;'; } // or '...'?
                        this.tokens[i].value = value;
                    }
                }
            }
        }
    },

    refreshEditorContents : function(){
        // update editor contents to reflect change
        for (edID in tinyMCE.editors){ // HACK to update multiple editors on same page (apparently TinyMCE shares config & modules for multiple areas)
            tinyMCE.editors[edID].setContent( this.fromSrc(tinyMCE.editors[edID].getContent()) );
        }
        //this.editor.setContent( this.fromSrc(this.editor.getContent()) );
        //console.log(this.tokens[4].value);
    },

    // WYSIWYG -> source: Substitutes the placeholders with the tokens
    toSrc : function(source){
        // console.log('to '+this.info.version);
        source = source.split(/<br\s*[\/]?>/gi).join('|*BRK*|'); // remove <br>'s (allow multi-line datafield values without breaking the regex)
        // source = source.split(/<a/gi).join('|*OPEN*|a'); // remove <a's (allow multi-line datafield values without breaking the regex)
        // source = source.split(/<\/a/gi).join('|*CLOSE*|a'); // remove </a's (allow multi-line datafield values without breaking the regex)
        var i,re;
        for(i=this.tokens.length-1; i>=0; i--) {
            //substitutes the placeholders with the tokens
            //var re_str = '\<(span|strong)[^\\>]+data-datafield="'+this.tokens[i].field.replace('(','\(').replace(')','\)')+'"[^\\>]?\>[^\\<]*\<\/(span|strong)>';

            // There may be breaks inside the span... (changed [^\\<]* into .*)
            // var re_str = '\<(span|strong)[^\\>]+data-datafield="'+this.tokens[i].field.replace('(','\(').replace(')','\)')+'"[^\\>]?\>[^\\<]*\<\/(span|strong)>';
            // var re_str = '\<(span|strong)[^\\>]+data-datafield="'+this.tokens[i].field.replace('(','\(').replace(')','\)')+'"[^\\>]?\>((?!(\<\/s)).)*\<\/(span|strong)>';
            var re_str = '\<(span|strong)[^\\>]+class="mceNonEditable" data-datafield="'
                +this.tokens[i].field
                    .replace('[','\[').replace(']','\]')
                    .replace('(','\(').replace(')','\)')
                +'"[^\\>]?\>((?!(\<\/s)).)*\<\/(span|strong)>';
            re = new RegExp(re_str, 'gi');
            // console.log(re_str);
            source = source.replace(re, '{$'+this.tokens[i].field+'}');

            // // Breaky breaky
            // source.split('<span')

        }
        source = source.split('|*BRK*|').join('<br />'); // restore breaks
        // source = source.split('|*OPEN*|a').join('<a'); // restore breaks
        // source = source.split('|*CLOSE*|a').join('</a'); // restore breaks
        return source;
    },

    // source -> WYSIWYG: Substitutes the tokens with the placeholders.
    fromSrc : function(source){
        // console.log('from '+this.info.version);
        // console.log(this.tokens);
        var i,re;
        for(i=this.tokens.length-1; i>=0; i--) {
            // class="mceNonEditable" / contenteditable="false"
            // var re_str = '\{\\$'+this.tokens[i].field.replace('(','\\(').replace(')','\\)')+'(?![^\\<\\>]*\\>)\}';
            var re_str = '\{\\$'+this.tokens[i].field
                .replace('[','\\[').replace(']','\\]')
                .replace('(','\\(').replace(')','\\)')
                +'(?![^\\<\\>]*\\>)\}';
            re = new RegExp(re_str, 'gi');
            var tokenValue = String(this.tokens[i].value).replace(/(?:\r\n|\r|\n)/g, '<br>'); // insert breaks instead of newlines
            // console.log(tokenValue);
            source = source.replace(re, // contenteditable="false"
                '<span class="mceNonEditable" data-datafield="'+this.tokens[i].field+'">'+tokenValue+'</span>');
        }
        return source;
    },

};

//
// TinyMCE plugin definitions
//
// console.log('LOADED');
(function() {
    if (typeof tinymce !== 'undefined') {

        //
        // TinyMCE~3 definition (SS3 version)
        //
        if(tinymce.majorVersion < 4){

            tinymce.create('tinymce.plugins.datafields', {
                getInfo : function() {
                    return datafields_editorplugin.info;
                },
                init : function(editor, url) {
                    // init the 'core'
                    datafields_editorplugin.init(editor);
                    // Listeners
                    editor.onBeforeSetContent.add( function(ed, e) {
                        //console.log('onbeforeset');
                        e.content = datafields_editorplugin.fromSrc(e.content);
                    } );
                    editor.onPostProcess.add( function(ed, e) {
                        //console.log('to');
                        e.content = datafields_editorplugin.toSrc(e.content);
                    } );
                },
                createControl : function (n, cm) {
                    // add to menu (only if not in front-end modus ('disable-dropdown')) (leave that for the MCEv4 version)
                    //if( jQuery(editor.getElement()).data('datafields-showdropdown') == false) { return; }
                    if (n == 'datafields') {
                        var datafields_drd = cm.createListBox('datafields', {
                            title: 'Data fields',
                            onselect: function (v) { //(extra space to be able to type after the 'noneditable' element inserted
                                tinyMCE.activeEditor.selection.setContent(datafields_editorplugin.fromSrc('{$'+v+'}'));
                                // tinyMCE.activeEditor.selection.setContent('{$'+v+'}');
                            }
                        });
                        // insert options
                        for (var i in datafields_editorplugin.tokens) {
                            datafields_drd.add(datafields_editorplugin.tokens[i].text, datafields_editorplugin.tokens[i].field);
                        }
                        return datafields_drd;
                    }
                    return null;
                },
            });
            // Adds the plugin class to the list of available TinyMCE plugins
            tinymce.PluginManager.add("datafields", tinymce.plugins.datafields);

        }
        //
        // TinyMCE 4+ definition (front-end/newest version)
        //
        else {

            tinymce.PluginManager.add('datafields', function(editor, url) {

                // init the 'core'
                datafields_editorplugin.init(editor);

                // Listeners
                editor.on('beforeSetContent', function(e) {
                    e.content = datafields_editorplugin.fromSrc(e.content);
                });
                editor.on('postProcess', function(e) {
                    e.content = datafields_editorplugin.toSrc(e.content);
                });

                // add to menu (only if not in front-end modus ('disable-dropdown')) -> disabled
                // if( ! jQuery(editor.getElement()).data('datafields-showdropdown') == false) {
                    editor.addButton('datafields', {
                        text: 'Data fields',
                        type: 'listbox',
                        values: datafields_editorplugin.tokens,
                        onselect: function (e) {
                            // editor.insertContent('$'+e.control.settings.field);
                            //console.log(e);
                            tinyMCE.activeEditor.selection.setContent(datafields_editorplugin.fromSrc('{$' + e.control.settings.field + '}'));
                        }
                    });
                // }

            });

        }
    }

})();
