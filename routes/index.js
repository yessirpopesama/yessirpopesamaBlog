/*
 * GET home page.
 */
var crypto = require('crypto');
var User = require('../models/user.js');
var Post = require('../models/post.js');
var Comment = require('../models/comment.js');
var fs = require('fs');

module.exports = function(app) {
	/* render用于页面渲染，有两个参数，它接受两个参数。
	 * 第一个是模板的名称，即 views 目录下的模板文件名,扩展名 .ejs 可选。
	 * 第二个参数是传递给模板的数据对象，用于模板翻译。
	 */
	// app.get('/', function(req, res) {
	// 	var page = req.query.p ? parseInt(req.query.p) : 1;
	// 	Post.getTen(null, page, function(err, posts, total) {
	// 		if (err) {
	// 			posts = [];
	// 		}
	// 		res.render('index', {
	// 			title: '主页',
	// 			user: req.session.user,
	// 			page: page,
	// 			isFirstPage: (page - 1) === 0,
	// 			isLastPage: ((page - 1) * 10 + posts.length) === total,
	// 			posts: posts,
	// 			success: req.flash('success').toString(),
	// 			error: req.flash('error').toString()
	// 		});
	// 	});
	// });

	app.get('/', function(req, res) {
		Post.getAll(null, function(err, posts) {
			if (err) {
				posts = [];
			}
			Post.getPopular(function(err, popPosts) {
				if (err) {
					popPosts = [];
				}
				console.log(popPosts);
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
	})

	app.get('/reg', checkNotLogin);
	app.get('/reg', function(req, res) {
		res.render('blogreg', {
			title: '注册',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/reg', checkNotLogin);
	app.post('/reg', function(req, res) {
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
				req.flash('success', '注册成功!');
				res.redirect('/');
			});
		});
	});

	app.get('/login', checkNotLogin);
	app.get('/login', function(req, res) {
		res.render('bloglogin', {
			title: '登录',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/login', checkNotLogin);
	app.post('/login', function(req, res) {
		console.log(req.body.password);
		var md5 = crypto.createHash('md5'),
			password = md5.update(req.body.password).digest('hex');

		User.get(req.body.name, function(err, user) {
			console.log(user);
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
	});

	app.get('/post', checkLogin);
	app.get('/post', function(req, res) {
		res.render('blogpost', {
			title: '发表',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/post', checkLogin);
	app.post('/post', function(req, res) {
		var tags = [req.body.tag1, req.body.tag2, req.body.tag3];
		var currentUser = req.session.user;

		var post = new Post(currentUser.name, currentUser.head, req.body.title, tags, req.body.post);
		post.save(function(err) {
			if (err) {
				req.flash('error').toString();
				return res.redirect('/');
			}
			req.flash('success').toString();
			return res.redirect('/');
		})

	});

	app.get('/logout', checkLogin);
	app.get('/logout', function(req, res) {
		req.session.user = null;
		req.flash('success', '登出成功!');
		res.redirect('/');
	});

	app.get('/upload', checkLogin);
	app.get('/upload', function(req, res) {
		res.render('blogupload', {
			title: '文件上传',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/upload', checkLogin);
	app.post('/upload', function(req, res) {
		for (var i in req.files) {
			if (req.files[i].size === 0) {
				fs.unlinkSync(req.files[i].path);
				console.log('Successfully remove a file');
			} else {
				// 上传targetPath位置 
				var targetPath = './public/images/upload/';
				// 读取共有多少文件
				var totalFileNumber = fs.readdirSync(targetPath).length;
				// 截取文件后缀
				var pathArray = req.files[i].path.split('.');
				var fileType = pathArray[pathArray.length - 1];
				// 文件重新定位
				targetPath = './public/images/upload/' + 'blog-' + (totalFileNumber + 1) + '.' + fileType;
				fs.renameSync(req.files[i].path, targetPath);
				console.log(totalFileNumber);
				console.log('Successfully upload a file');
			}
		}
		req.flash('success', '文件上传成功');
		// 重定向到图片强
		return res.redirect('/viewpic');
	});

	app.get('/viewpic', function(req, res) {
		var picPath = './public/images/upload';
		fs.readdir(picPath, function(err, files) {
			if (err) {
				console.log('Files Reading Error');
				res.redirect('/');
			}
			console.log(files);
			res.render('blogviewpic', {
				title: '图片墙',
				user: req.session.user,
				files: files,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});

	app.get('/achive', function(req, res) {
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
	})

	app.get("/u/:name", function(req, res) {
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

	app.get('/p/:_id', function(req, res) {
		Post.getOne(req.params._id, function(err, post) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			console.log(post.post);
			res.render('blogarticle', {
				title: "单独文章",
				post: post,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});

	app.get('/edit/:name/:day/:title', checkLogin);
	app.get('/edit/:name/:day/:title', function(req, res) {
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

	app.post('/edit/:name/:day/:title', checkLogin);
	app.post('/edit/:name/:day/:title', function(req, res) {
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

	app.get('/remove/:name/:day/:title', checkLogin);
	app.get('/remove/:name/:day/:title', function(req, res) {
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

	app.get('/reprint/:name/:day/:title', checkLogin);
	app.get('/reprint/:name/:day/:title', function(req, res) {
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

	// app.post('/u/:name/:day/:title', function(req, res) {
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

	app.get('/tags', function(req, res) {
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

	app.get('/tags/:tag', function(req, res) {
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
	app.get('/search', function(req, res) {
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

	app.use(function(req, res) {
		res.render('blog404');
	})

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
}