var crypto = require('crypto');
var User = require('../models/user');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var configInfo = require('../settings');

module.exports.get = function(req, res) {
	res.render('blogreg', {
		title: '注册',
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	});
}

module.exports.post = function(req, res) {
	var name = req.body.name,
		password = req.body.password,
		password_re = req.body.passwordRe;
	if (password_re != password) {
		req.flash('error', '两次输入的密码不一致!');
		return res.redirect('/reg');
	}
	var md5 = crypto.createHash('md5'),
		password = md5.update(req.body.password).digest('hex');
	var newUser = new User({
		name: name,
		password: password,
		email: req.body.email
	});
	User.get(newUser.name, function(err, user) {
		if (user) {
			req.flash('error', '用户已存在!');
			return res.redirect('/reg');
		}
		newUser.save(function(err, user) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/reg');
			}
			req.session.user = user;

			//发送成功注册邮件
			var transport = nodemailer.createTransport(smtpTransport(configInfo.hostConfig));
			console.log('Email = ', user.email);
			configInfo.targetInfo.to = user.email;  
			console.log(configInfo);
			transport.sendMail(configInfo.targetInfo, function(error, response) {
				if (error) {
					console.log(error);
					return;
				} else {
					console.log("Message sent: " + response.message);
				}
				transport.close();
			});

			req.flash('success', '注册成功!');
			res.redirect('/');
		});
	});
}