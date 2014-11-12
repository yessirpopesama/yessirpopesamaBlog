var crypto = require('crypto');

module.exports.get = function(req, res) {
	res.render('bloglogin', {
		title: '登录',
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	});
}

module.exports.post = function(req, res) {
	var md5 = crypto.createHash('md5'),
		password = md5.update(req.body.password).digest('hex');

	User.get(req.body.name, function(err, user) {
		if (!user) {
			req.flash('error', '用户不存在!');
			return res.redirect('/login');
		}
		if (user.password != password) {
			req.flash('error', '密码错误!');
			return res.redirect('/login');
		}
		req.session.user = user;
		req.flash('success', '登陆成功!');
		res.redirect('/');
	});
}

module.exports.logout = function(req, res) {
	req.session.user = null;
	req.flash('success', '登出成功!');
	res.redirect('/');
}