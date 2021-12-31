/**
 TinyMCE mergetags editor plugin (for SilverStripe)
 license: http://www.opensource.org/licenses/mit-license.php

 TineMCE 'mergetags' should be declared as an array of objects.
 Each object can have the following properties:
 tag	Tag field name + fallback(s) (after |, first returning value will be used) (eg '{$Recipient.FirstName|there}')
 label	[optional] The name of this tag in the insert-dropdown (eg 'Recipient firstname')
 */

// General plugin definition object/methods
var mergetags_editorplugin = {

    editor : null,
    $form : null,

    info : {
        longname : 'Mergetags',
        author : 'Restruct',
        authorurl : 'http://restruct.nl',
        infourl : 'http://restruct.nl/',
        version : "1.0"
    },

    // mergetags
    mergetags : [],
    mergetagDropdownItems : [],
    test : [
        { text_1: 'Headings', disabled234: true },
            { text: 'Heading 1', value: 'h1' },
    //         { text: 'Heading 2', value: 'h2' },
    //         { text: 'Heading 3', value: 'h3' },
    //         { text: 'Heading 4', value: 'h4' },
    //         { text: 'Heading 5', value: 'h5' },
    //         { text: 'Heading 6', value: 'h6' },
    //     { text: 'Inline', menu: [
    //         { title: 'Bold', format: 'bold' },
    //         { title: 'Italic', format: 'italic' },
    //         { title: 'Underline', format: 'underline' },
    //         { title: 'Strikethrough', format: 'strikethrough' },
    //         { title: 'Superscript', format: 'superscript' },
    //         { title: 'Subscript', format: 'subscript' },
    //         { title: 'Code', format: 'code' }
    //     ]}
    ],

    init : function(editor){

        // save some references
        var self = this;
        this.editor = editor;

        // Get mergetags / prepare the menu list to be used in addButton() and addMenuItem()
        if(jQuery && jQuery(editor.getElement()).data('mergetags')){ // if jQuery && datafields attribute
            this.mergetags = jQuery(editor.getElement()).data('mergetags'); // get mergetags from data-attribute
        } else { // else: get mergetags from general config
            this.mergetags = editor.getParam('mergetags',[]);
        }

        // duplicate tag & label to text & value for tinyMCE dropdown
        // for(var i=this.mergetags.length-1; i>=0; i--) {
        var curOptHolder = this.mergetagDropdownItems;
        for(var i=0; i<this.mergetags.length; i++) {
            // insert menus if defined...
            if(this.mergetags[i].menu){
                this.mergetagDropdownItems.push({
                    text: this.mergetags[i].label,
                    disabled: this.mergetags[i].disabled,
                    // group: true,
                    'menu': [],
                });
                curOptHolder = this.mergetagDropdownItems[ this.mergetagDropdownItems.length -1 ].menu;
                continue;
            }
            // insert regular items
            curOptHolder.push({
                text: (this.mergetags[i].label ? this.mergetags[i].label : this.mergetags[i].tag),
                value: this.mergetags[i].tag ? this.mergetags[i].tag : '',
                disabled: this.mergetags[i].disabled,
            });
        }

    },

};

//
// TinyMCE plugin definitions
//
(function() {
    if (typeof tinymce !== 'undefined') {

        //
        // TinyMCE~3 definition (SS3 version)
        //
        if(tinymce.majorVersion < 4){

            tinymce.create('tinymce.plugins.mergetags', {
                getInfo : function() {
                    return mergetags_editorplugin.info;
                },
                init : function(editor, url) {
                    // init the 'core'
                    mergetags_editorplugin.init(editor);
                },
                createControl : function (n, cm) {
                    if (n == 'mergetags') {
                        var mergetags_drd = cm.createListBox('mergetags', {
                            title: 'Merge tags',
                            onselect: function (value) {
                                tinyMCE.activeEditor.selection.setContent(value);
                            }
                        });
                        // insert options
                        for (var i in mergetags_editorplugin.mergetagDropdownItems) {
                            mergetags_drd.add(mergetags_editorplugin.mergetags[i].label, mergetags_editorplugin.mergetags[i].tag);
                        }
                        return mergetags_drd;
                    }
                    return null;
                },
            });
            // Adds the plugin class to the list of available TinyMCE plugins
            tinymce.PluginManager.add("mergetags", tinymce.plugins.mergetags);

        }
        //
        // TinyMCE 4+ definition (front-end/newest version)
        //
        else {

            tinymce.PluginManager.add('mergetags', function(editor, url) {

                // init the 'core'
                mergetags_editorplugin.init(editor);

                editor.addButton('mergetags', {
                    text: 'Merge tags',
                    type: 'listbox',
                    values: mergetags_editorplugin.mergetagDropdownItems,
                    onselect: function (e) {
                        tinyMCE.activeEditor.selection.setContent(e.control.settings.value);
                    }
                });

            });

        }
    }

})();
