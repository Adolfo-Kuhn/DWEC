<?php
    header('Content-Type: application/json; charset=utf-8');
    $myObj = new stdClass();
    $myObj -> plataforma = $_SERVER['HTTP_USER_AGENT'];
    $myObj -> version = phpversion();
    $myObj -> fecha = date("F j, Y, g:i a");
?>
<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <title></title>
    </head>
    <body>
        <?php
        
        ?>
    </body>
</html>
