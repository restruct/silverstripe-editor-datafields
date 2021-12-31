/**
 TinyMCE datafields_editorplugin (for SilverStripe)
 license: http://www.opensource.org/licenses/mit-license.php

 A replacable datafields (tokens) plugin for TinyMCE (4).
 Tokens act as placeholders for object datafields, eg a recipient's name, or a dropdown's value.

 TineMCE 'data_fields' should be declared as an array of objects.
 Each object can have the following properties:
 field	The field name/value (eg '$Recipient.Fullname')
 title	[optional] The name of this field in the insert-dropdown (eg 'Recipient name')
 value	[optional] The default text of the inserted token (eg 'John Doe')
 */


// TinyMCE~3 definition (SS3 version)

(function() {
    if (typeof tinymce !== 'undefined') {
    	tinymce.create('tinymce.plugins.datafields', {

    		getInfo : function() {
    			return {
    				longname : 'Datafields',
    				author : 'Restruct',
    				authorurl : 'http://restruct.nl',
    				infourl : 'http://restruct.nl/',
    				version : "1"
    			};
    		},

            createControl : function (n, cm) {
                if (n == 'datafields') {

                    var datafields_drd = cm.createListBox('datafields', {
                        title: 'Data fields',
                        onselect: function (v) { //(extra space to be able to type after the 'noneditable' element inserted
                            tinyMCE.activeEditor.selection.setContent(tinyMCE.activeEditor.datafields_fromSrc('{$'+v+'}'));
                            // tinyMCE.activeEditor.selection.setContent('{$'+v+'}');
                        }
                    });

                    // insert options
                    for (var i in cm.editor.datafields) {
                        datafields_drd.add(cm.editor.datafields[i].title, cm.editor.datafields[i].field);
                    }
                    return datafields_drd;
                }
                return null;
            },

    		init : function(editor, url) {

                // crap
                editor.datafields_version = "0.3";
                
                // prepare the menu list to be used in addButton() and addMenuItem()
                var tokens = editor.getParam('data_fields',[]);
                for(var i=tokens.length-1; i>=0; i--) {
                    //if a title / value was not set then set a default one
                    if(tokens[i].title == undefined) tokens[i].title = tokens[i].field.replace('$','');
                    if(tokens[i].value == undefined) tokens[i].value = tokens[i].title;
                }
                // save for later reference
                editor.datafields = tokens;

                // add some styling
                editor.contentStyles.push('strong[data-datafield] { background-color: #FFEB3B; border-radius: 4px; padding: 3px 1px; border: 1px dashed #EFDB3B; }');

                // Listeners
                editor.onBeforeSetContent.add( function(ed, e) {
                    //console.log('onbeforeset');
                    e.content = ed.datafields_fromSrc(e.content);
                } );
                editor.onPostProcess.add( function(ed, e) {
                    //console.log('to');
                    e.content = ed.datafields_toSrc(e.content);
                } );

                // WYSIWYG -> source: Substitutes the placeholders with the tokens.
                editor.datafields_toSrc = function(s) {
                    console.log('to '+this.datafields_version);
                    var tokens = editor.datafields;
                    var i,re;
                    for(i=tokens.length-1; i>=0; i--) {
                        //to prevent the text equal to a token to be treated as a token (doesn't work)
                        // s = s.replace('{$'+tokens[i].field+'}', '{&#x24;'+tokens[i].field+'}');

                        //substitutes the placeholders with the tokens
                        var re_str = '\<strong[^\\>]+data-datafield="'+tokens[i].field.replace('(','\(').replace(')','\)')+'"[^\\>]?\>[^\\<]*\<\/strong>';
                        re = new RegExp(re_str, 'gi');
                        // console.log(re_str);
                        s = s.replace(re, '{$'+tokens[i].field+'}');
                    }
                    return s;
                };

                // source -> WYSIWYG: Substitutes the tokens with the placeholders.
                editor.datafields_fromSrc = function(s) {
                    console.log('from '+this.datafields_version);
                    var tokens = editor.datafields;
                    var i,re;
                    for(i=tokens.length-1; i>=0; i--) {
                        // class="mceNonEditable" / contenteditable="false"
                        var re_str = '\{\\$'+tokens[i].field.replace('(','\\(').replace(')','\\)')+'(?![^\\<\\>]*\\>)\}';
                        re = new RegExp(re_str, 'gi');
                        // console.log(re_str);
                        s = s.replace(re, '<strong class="mceNonEditable" data-datafield="'+tokens[i].field+'">'+tokens[i].value+'</strong>');
                    }
                    return s;
                };


    		}

    	});

    	// Adds the plugin class to the list of available TinyMCE plugins
    	tinymce.PluginManager.add("datafields", tinymce.plugins.datafields);

    }
})();

// TinyMCE 4 definition
// (function() {
//     if (typeof tinymce !== 'undefined') {
//         tinymce.PluginManager.add('datafields', function(editor, url) {
//
//             var tokens = editor.getParam('data_fields',[]);
//
//             console.log(tokens);
//
//
//             /**
//              WYSIWYG -> source
//              Substitutes the placeholders with the tokens.
//              */
//             function _toSrc(s) {
//                 var i,re;
//                 for(i=tokens.length-1; i>=0; i--) {
//                     //to prevent the text equal to a token to be treated as a token
//                     re = new RegExp('\\[\\!'+tokens[i].escapedToken+'\\](?![^\\<\\>]*\>)', 'gi');
//                     s = s.replace(re, '[&#x21;'+tokens[i].token+']');
//
//                     //substitutes the placeholders with the tokens
//                     //re = new RegExp('\<strong[^\\>]+data-placeholder\\=\\"'+tokens[i].escapedToken+'\\"[^\\>]*\>\<\/strong\>', 'gi');
//                     re = new RegExp('\<strong[^\\>]+data-placeholder="'+tokens[i].escapedToken+'"[^\\>]?\>[a-zA-Z\s]*\<\/strong>', 'gi');
//                     s = s.replace(re, '$'+tokens[i].field);
//                 }
//                 return s;
//             }
//
//
//             /**
//              source -> WYSIWYG
//              Substitutes the tokens with the placeholders.
//              */
//             function _fromSrc(s) { console.log('replace');
//                 var i,re;
//                 for(i=tokens.length-1; i>=0; i--) {
//                     re = new RegExp('\\$'+tokens[i].escapedToken+'(?![^\\<\\>]*\\>)', 'gi');
//                     //s = s.replace(re, '<img src="'+tokens[i].image+'" placeholder_data="'+tokens[i].token+'">');
//                     s = s.replace(re, '<strong data-datafield="'+tokens[i].field+'" contenteditable="false">'+tokens[i].value+'</strong>');
//                 }
//                 return s;
//             }
//
//
//             //--------------------------------
//
//             //prepare the menu list to be used in addButton() and addMenuItem()
//             var datafields_menu = new Array();
//             for(var i=tokens.length-1; i>=0; i--) {
//                 //if a title was not set then set a default one
//                 if(tokens[i].title == undefined)
//                     tokens[i].title = tokens[i].field;
//
//                 datafields_menu.push({text:tokens[i].title, token:tokens[i].field});
//
//                 //to prevent that special chars into the tokens make mess
//                 console.log(tokens[i]);
//                 tokens[i].escapedField = tokens[i].field.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
//
//                 //if an image was not set then set a default one
//                 if(tokens[i].value == undefined)
//                     tokens[i].value = tokens[i].title;
//             }
//             console.log(editor);
//             editor.addButton('datafields', {
//                 text: 'Data fields',
//                 type: 'listbox',
//                 values: datafields_menu,
//                 onselect: function(e) {
//                     editor.insertContent('$'+e.control.settings.field);
//                 }
//             });
//             // editor.addMenuItem('datafields', {
//             //     text: 'Data fields',
//             //     context: 'insert',
//             //     menu: datafields_menu,
//             //     onselect: function(e) {
//             //         editor.insertContent('$'+e.control.settings.field);
//             //     }
//             // });
//
//             // add some custom styling to the placeholder fields
//             // editor.on('init',function(ed){
//             editor.onInit(function(ed){
//                 ed.target.dom.addStyle('strong[data-datafield] { background-color: #FFEB3B; border-radius: 4px; padding: 4px 2px; }');
//             });
//
//             // editor.on('beforeSetContent', function(e) {
//             //     e.content = _fromSrc(e.content);
//             // });
//             // editor.on('postProcess', function(e) {
//             //     e.content = _toSrc(e.content);
//             // });
//
//         });
//
//     }
// })();