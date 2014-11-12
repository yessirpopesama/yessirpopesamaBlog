var Post = require('../models/post.js');

module.exports = function(req, res) {
	Post.getAll(null, function(err, posts) {
		if (err) {
			posts = [];
		}
		Post.getPopular(function(err, popPosts) {
			console.log('eyey');
			if (err) {
				popPosts = [];
			}
			// console.log(popPosts);
			res.render('index', {
				title: '主页',
				user: req.session.user,
				posts: posts,
				popPosts: popPosts,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		})
	})
}