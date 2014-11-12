module.exports.get = function(req, res) {
	res.render({
		title: '发送邮件',
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	})
}

// module.exports.post = function(req, res) {
// 	var address = req.body.address;
// 	var advice = req.body.advice;

	
// }