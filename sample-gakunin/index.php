<?php
require_once "HTTP/Request2.php";

if(!$_SERVER['persistent-id']){
  // eduPersonTargetedID が存在しない場合は認証エラー
  header("HTTP/1.1 403 Forbidden");
  exit;
}

$POLLY_USER                = htmlspecialchars($_SERVER['eppn']);
$POLLY_PASSWORD            = 'chilo';
$POLLY_LOGIN_URL           = 'https://localhost:3000/login';
$POLLY_DIALOG_FINISHED_URL = 'https://localhost:3000/finished.html';
$POLLY_COOKIE_DOMAIN       = 'localhost';

$request = new HTTP_Request2();
$request->setUrl($POLLY_LOGIN_URL);
$request->setMethod(HTTP_Request2::METHOD_POST);
$request->addPostParameter("user_id", $POLLY_USER);
$request->addPostParameter("password", $POLLY_PASSWORD);

try {
  $response = $request->send();
  $cookies  = $response->getCookies();
  setcookie($cookies[0]["name"], $cookies[0]["value"], 0, "/", $POLLY_COOKIE_DOMAIN);
  header("HTTP/1.1 302 Found");
  header("Location:" . $POLLY_DIALOG_FINISHED_URL);
} catch (HTTP_Request2_Exception $e) {
  echo 'Error: ' . $e->getMessage();
}
