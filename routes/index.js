var express = require('express');
var router = express.Router();
// Import All the Route
var homeRoute = require('../routes/home')
var achiveRoute = require('../routes/achive');
var viewPictureRoute = require('../routes/viewPicture');
var registerRoute = require('../routes/register');
var loginRoute = require('../routes/login');
var postRoute = require('../routes/post');
var uploadRoute = require('../routes/upload');

var crypto = require('crypto');
var User = require('../models/user.js');
var Post = require('../models/post.js');
var fs = require('fs');


/* Get home page. */
router.get('/', homeRoute);

/* Get Register Page */
router.get('/reg', checkNotLogin);
router.get('/reg', registerRoute.get);
router.post('/reg', checkNotLogin);
router.post('/reg', registerRoute.post);

/* Get Login Page */
router.get('/login', checkNotLogin);
router.get('/login', loginRoute.get);
router.post('/login', checkNotLogin);
router.post('/login', loginRoute.post);
router.get('/logout', checkLogin);
router.get('/logout', loginRoute.logout);

/* Get Post Page */
router.get('/post', checkLogin);
router.get('/post', postRoute.get);
router.post('/post', checkLogin);
router.post('/post', postRoute.post);

/* Get Upload Page */
router.get('/upload', checkLogin);
router.get('/upload', uploadRoute.get);
router.post('/upload', checkLogin);
router.post('/upload', uploadRoute.post);

router.get('/viewpic', viewPictureRoute.get);
router.get('/achive', achiveRoute);

router.get("/u/:name", function(req, res) {
	var page = req.query.p ? parseInt(req.query.p) : 1;
	// 查询用户是否存在
	User.get(req.params.name, function(err, user) {
		if (!user) {
			req.flash('error', '用户不存在');
			return res.redirect('/');
		}

		// 查询并返回该用户第 page 页的 10 篇文章
		Post.getTen(user.name, page, function(err, posts, total) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/');
			};
			res.render('user', {
				title: user.name,
				posts: posts,
				page: page,
				isFirstPage: (page - 1) == 0,
				isLastPage: ((page - 1) * 10 + posts.length) == total,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			})
		})
	})
});

router.get('/p/:_id', function(req, res) {
	Post.getOne(req.params._id, function(err, post) {
		if (err) {
			req.flash('error', err);
			return res.redirect('/');
		}
		res.render('blogarticle', {
			post: post,
			user: req.session.user
		});
	});
});

router.get('/edit/:name/:day/:title', checkLogin);
router.get('/edit/:name/:day/:title', function(req, res) {
	var currentUser = req.session.user;
	Post.edit(currentUser.name, req.params.day, req.params.title, function(err, post) {
		if (err) {
			req.flash('error', err);
			res.redirect('/');
		}
		res.render('edit', {
			title: '编辑',
			post: post,
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		})
	})
});

router.post('/edit/:name/:day/:title', checkLogin);
router.post('/edit/:name/:day/:title', function(req, res) {
	var currentUser = req.session.user;
	Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function(err) {
		var url = '/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title;
		// 出错，返回article页
		if (err) {
			req.flash('error', err);
			res.redirect(url);
		}
		req.flash('success', '修改成功');
		res.redirect(url);
	});
});

router.get('/remove/:name/:day/:title', checkLogin);
router.get('/remove/:name/:day/:title', function(req, res) {
	var currentUser = req.session.user;
	Post.remove(currentUser.name, req.params.day, req.params.title, function(err) {
		if (err) {
			req.flash('error', err);
			return res.redirect('back');
		}
		req.flash('success', '删除成功');
		res.redirect('/');
	});
});

router.get('/reprint/:name/:day/:title', checkLogin);
router.get('/reprint/:name/:day/:title', function(req, res) {
	Post.edit(req.params.name, req.params.day, req.params.title, function(err, post) {
		if (err) {
			req.flash('error', err);
			return res.redirect(back);
		}
		var currentUser = req.session.user,
			reprint_from = {
				name: post.name,
				day: post.time.day,
				title: post.title
			},
			reprint_to = {
				name: currentUser.name,
				head: currentUser.head
			};
		Post.reprint(reprint_from, reprint_to, function(err, post) {
			if (err) {
				req.flash('error', err);
				return res.redirect('back');
			}
			req.flash('success', '转载成功!');
			var url = '/u/' + post.name + '/' + post.time.day + '/' + post.title;
			//跳转到转载后的文章页面
			res.redirect(url);
		});
	});
});

// router.post('/u/:name/:day/:title', function(req, res) {
// 	var date = new Date();
// 	var time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
// 		date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
// 	var md5 = crypto.createHash('md5'),
// 		email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex'),
// 		head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";
// 	var comment = {
// 		name: req.body.name,
// 		time: time,
// 		email: req.body.email,
// 		website: req.body.website,
// 		content: req.body.content,
// 		head: head
// 	}
// 	var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
// 	newComment.save(function(err) {
// 		if (err) {
// 			req.flash('error', err);
// 			res.redirect('back');
// 		}
// 		req.flash('success', '评论成功');
// 		res.redirect('back');
// 	});
// });

router.get('/tags', function(req, res) {
	Post.getTags(function(err, posts) {
		if (err) {
			req.flash('error', err);
			return res.redirect('/');
		}
		res.render('tags', {
			title: '标签',
			posts: posts,
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
});

router.get('/tags/:tag', function(req, res) {
	Post.getTag(req.params.tag, function(err, posts) {
		if (err) {
			req.flash('error', err);
			return res.redirect('/');
		}
		res.render('tag', {
			title: 'TAG:' + req.params.tag,
			posts: posts,
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
});

/*       仍有bug，机能没有全部做完   */
router.get('/search', function(req, res) {
	Post.search(req.query.keyword, function(err, posts) {
		if (err) {
			req.flash('error', error);
			return res.redirect('/');
		}
		res.render('blogsearch', {
			title: 'Search' + req.query.keyword,
			posts: posts,
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
});

// router.use(function(req, res) {
// 	res.render('blog404');
// })

function checkLogin(req, res, next) {
	if (!req.session.user) {
		req.flash('error', '未登录!');
		res.redirect('/login');
	}
	next();
}

function checkNotLogin(req, res, next) {
	if (req.session.user) {
		req.flash('error', '已登录!');
		res.redirect('back');
	}
	next();
}

module.exports = router;