<?php
/**
 * A class that inherits from HtmlEditorConfig to allow accessing protected properties
 **/

namespace Restruct\HTMLEditor\DataFields;

use SilverStripe\Core\Manifest\ModuleResourceLoader;
use SilverStripe\Forms\HTMLEditor\HTMLEditorConfig;
use SilverStripe\Forms\HTMLEditor\TinyMCEConfig;

class HTMLEditorConfigHelper extends TinyMCEConfig
{
    // allows accessing protected properties
    public static function get_config_property($configName, $propertyName)
    {
        $config = parent::get($configName);
        return $config->$propertyName;
    }

    public static function duplicate_config($existingName, $newName)
    {
        // Create a HTMLEditorConfig for statusupdates
        $html_conf_options = self::get_config_property($existingName,'settings');
        $html_conf_plugins = self::get_config_property($existingName,'plugins');
        $html_conf_buttons = self::get_config_property($existingName,'buttons');
        // duplicate options & plugins
        $newconf = HtmlEditorConfig::get($newName)
            ->setOptions( $html_conf_options )
            ->enablePlugins( $html_conf_plugins );
        // dup buttons
        foreach($html_conf_buttons as $line => $buttons){
            $newconf->setButtonsForLine($line, $buttons);
        }

        return $newconf;
    }

    public static function apply_datafields_base($configName)
    {
        $jsUrl = ModuleResourceLoader::singleton()
            ->resolveURL('restruct/silverstripe-editor-datafields:/client/js/datafields.js');
//        die($jsUrl);
        HtmlEditorConfig::get($configName)
            ->enablePlugins(
                array(
                    'noneditable',
//                    'datafields' => sprintf('../../../%s/js/datafields_editorplugin.js', DATAFIELDS_DIR),
//                    'datafields' => sprintf('../../../%s/js/datafields.js', DATAFIELDS_DIR),
                    'datafields' => $jsUrl,
                ))
            ->addButtonsToLine(2, [ 'datafields' ])
//            ->setOption('extended_valid_elements', 'strong[contenteditable]')
        ;
    }

    public static function apply_mergetags_base($configName)
    {
        $jsUrl = ModuleResourceLoader::singleton()
            ->resolveURL('restruct/silverstripe-editor-datafields:/client/js/mergetags.js');
//        die($jsUrl);
        HtmlEditorConfig::get($configName)
            ->enablePlugins(
                array(
                    'noneditable',
//                    'datafields' => sprintf('../../../%s/js/datafields_editorplugin.js', DATAFIELDS_DIR),
//                    'datafields' => sprintf('../../../%s/js/datafields.js', DATAFIELDS_DIR),
                    'mergetags' => $jsUrl,
                ))
            ->addButtonsToLine(2, [ 'mergetags' ])
//            ->setOption('extended_valid_elements', 'strong[contenteditable]')
        ;
    }

}
