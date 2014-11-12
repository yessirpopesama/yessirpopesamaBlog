var post = require('../routes/post');

module.exports.get = function(req, res) {
	res.render('blogpost', {
		title: '发表',
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	});
}

module.exports.post = function(req, res) {
	var tags = [req.body.tag1, req.body.tag2, req.body.tag3];
	var currentUser = req.session.user;

	var post = new Post(currentUser.name, currentUser.head, req.body.title, tags, req.body.post);
	post.save(function(err) {
		// 文章保存失败
		if (err) {
			req.flash('error').toString();
			return res.redirect('/');
		}
		// 更新+2加班值
		User.addClassExpUp(currentUser.name, 2, function(err) {
			if (err) {
				req.flash('error').toString();
				return res.redirct('/');
			}
		});
		return res.redirect('/');
	});
}