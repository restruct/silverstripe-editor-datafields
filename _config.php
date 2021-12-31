<?php

/**
 * The actual fields available can be set like below, in site/module specific _config.php (or probably yaml)

HtmlEditorConfig::get('cms')->setOption( 'data_fields',
    array(
    array( 'field' => 'Person.Name', 'title' => 'Naam persoon', 'value' => 'John' ),
    array( 'field' => 'StatusDescription', 'title' => 'Desc' ),
    array( 'field' => 'Another' ),
    )
);
 */

//if (!defined('DATAFIELDS_DIR')) {
//    define('DATAFIELDS_DIR', rtrim(basename(dirname(__FILE__))));
//}

// Render the resulting html like this: SSViewer::fromString($this->HTMLField)->process($this)

//HtmlEditorConfig::get('cms')->enablePlugins(
//    array('datafields' => sprintf('../../../%s/js/datafields_editorplugin.js', DATAFIELDS_DIR)));
//HtmlEditorConfig::get('cms')->addButtonsToLine(2, 'datafields');

