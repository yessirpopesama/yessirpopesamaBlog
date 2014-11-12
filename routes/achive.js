var Post = require('../models/post.js');

module.exports = function(req, res) {
	Post.getAchived(function(err, posts) {
		if (err) {
			req.flash('error', err);
			return res.redirect('back');
		}
		res.render('blogachive', {
			title: '博客存档',
			posts: posts,
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		})
	})
}