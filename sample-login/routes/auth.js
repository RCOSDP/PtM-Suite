const express = require('express');

const router = express.Router();

router.get('/dialog/start', function(req, res) {
  const data = {
    title: 'Login Dialog',
  };
  res.render('start', data);
});

router.post('/dialog/start', function(req, res) {
  console.log(req.body);
  res.cookie('session_cookie', req.body.user_id, {
    path: "/",
    secure: false,
    httpOnly: false,
  });
  res.redirect('/finished.html');
});

module.exports = router;
