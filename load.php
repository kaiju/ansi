<?php
if (isset($_GET['filename']) && file_exists(basename($_GET['filename']))) {
    header("Content-type: text/plain; charset=ISO-8859-1");
    echo file_get_contents(basename($_GET['filename']));
} else {
    header("HTTP/1.0 404 Not Found");
}
?>