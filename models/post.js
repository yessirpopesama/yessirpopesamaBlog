var mongodb = require('mongodb').Db;
var settings = require('../settings');
var ObjectID = require('mongodb').ObjectID;

function Post(name, head, title, tags, post) {
	this.name = name;
	this.title = title;
	this.tags = tags;
	this.post = post;
	this.head = head;
}

module.exports = Post;

// 文章保存
Post.prototype.save = function(callback) {
	var date = new Date();
	var time = {
		date: date,
		year: date.getFullYear(),
		month: date.getFullYear() + "-" + (date.getMonth() + 1),
		day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
		minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
			date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
	}

	var mdt = function(month) {
		var monthStr;
		switch (month) {
			case 1:
				monthStr = 'January';
				break;
			case 2:
				monthStr = 'February';
				break;
			case 3:
				monthStr = 'March';
				break;
			case 4:
				monthStr = 'April';
				break;
			case 5:
				monthStr = 'May';
				break;
			case 6:
				monthStr = 'June';
				break;
			case 7:
				monthStr = 'July';
				break;
			case 8:
				monthStr = 'August';
				break;
			case 9:
				monthStr = 'September';
				break;
			case 10:
				monthStr = 'October';
				break;
			case 11:
				monthStr = 'November';
				break;
			case 12:
				monthStr = 'December';
				break;
			default:
				monthStr = 'unDefined'
				break;
		}
		return monthStr;
	}

	var monthToStr = mdt(date.getMonth() + 1);

	var post = {
		name: this.name,
		title: this.title,
		head: this.head,
		tags: this.tags,
		post: this.post,
		time: time,
		comments: [],
		pv: 0,
		reprint_info: {},
		monthToStr: monthToStr
	}

	mongodb.connect(settings.url, function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if (err) {
				db.close();
				return callback(err);
			}
			collection.insert(post, {
				safe: true
			}, function(err) {
				db.close();
				if (err) {
					return callback(err);
				}
				callback(null);
			});
		});
	});
}

Post.getAchived = function(callback) {
	//打开数据库
	mongodb.connect(settings.url, function(err, db) {
		if (err) {
			return callback(err);
		}
		//读取 posts 集合  
		db.collection('posts', function(err, collection) {
			if (err) {
				db.close();
				return callback(err);
			}
			//返回只包含 name、time、title 属性的文档组成的存档数组
			collection.find({}, {
				"name": 1,
				"title": 1,
				"time": 1
			}).sort({
				time: -1
			}).toArray(function(err, docs) {
				db.close();
				if (err) {
					return callback(err); //失败！返回 err
				}
				callback(null, docs); //成功！以数组形式返回查询的结果
			});
		});
	});
};

Post.getAll = function(name, callback) {
	//打开数据库
	mongodb.connect(settings.url, function(err, db) {
		if (err) {
			return callback(err);
		}
		//读取 posts 集合
		db.collection('posts', function(err, collection) {
			if (err) {
				db.close();
				return callback(err);
			}
			var query = {};
			if (name) {
				query.name = name;
			}
			//根据 query 对象查询文章
			collection.find(query).sort({
				time: -1
			}).toArray(function(err, docs) {
				db.close();
				if (err) {
					return callback(err); //失败！返回 err
				}
				callback(null, docs); //成功！以数组形式返回查询的结果
			});
		});
	});
};

Post.getPopular = function(callback) {
	//打开数据库
	mongodb.connect(settings.url, function(err, db) {
		if (err) {
			return callback(err);
		}
		//读取 posts 集合
		db.collection('posts', function(err, collection) {
			if (err) {
				db.close();
				return callback(err);
			}
			//根据pv访问度排序 -1为降序
			collection.find({}).sort({
				pv: -1
			}).toArray(function(err, docs) {
				db.close();
				if (err) {
					return callback(err); //失败！返回 err
				}
				callback(null, docs); //成功！以数组形式返回查询的结果
			});
		});
	});
};

Post.getTen = function(name, page, callback) {
	//打开数据库
	mongodb.connect(settings.url, function(err, db) {
		if (err) {
			return callback(err);
		}
		//读取 posts 集合
		db.collection('posts', function(err, collection) {
			if (err) {
				db.close();
				return callback(err);
			}
			var query = {};
			if (name) {
				query.name = name;
			}

			collection.count(query, function(err, total) {
				if (err) {
					db.close();
					return callback(err);
				}
				//根据 query 对象查询文章
				collection.find(query, {
					skip: (page - 1) * 10,
					limit: 10
				}).sort({
					time: -1
				}).toArray(function(err, docs) {
					db.close();
					if (err) {
						return callback(err); //失败！返回 err
					}
					callback(null, docs, total); //成功！以数组形式返回查询的结果
				});
			});
		});
	});
};

Post.getOne = function(_id, callback) {
	mongodb.connect(settings.url, function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if (err) {
				db.close();
				return callback(err);
			}

			collection.findOne({
				"_id" : new ObjectID(_id)
			}, function(err, doc) {
				if (err) {
					db.close();
					return callback(err);
				}
				if (doc) {
					//每访问1次 pv增加1
					collection.update({
						"_id" : new ObjectID(_id)
					}, {
						$inc: {
							"pv": 1
						}
					}, function(err) {
						db.close();
						if (err) {
							return callback(err);
						}
					});
				}
				callback(null, doc);
			});
		})
	})
}

//返回原始发表的内容
Post.edit = function(name, day, title, callback) {
	//打开数据库
	mongodb.connect(settings.url, function(err, db) {
		if (err) {
			return callback(err);
		}
		//读取 posts 集合
		db.collection('posts', function(err, collection) {
			if (err) {
				db.close();
				return callback(err);
			}
			//根据用户名、发表日期及文章名进行查询
			collection.findOne({
				"name": name,
				"time.day": day,
				"title": title
			}, function(err, doc) {
				db.close();
				if (err) {
					return callback(err);
				}
				callback(null, doc); //返回查询的一篇文章
			});
		});
	});
};

// 更新一篇文章
Post.update = function(name, day, title, post, callback) {
	mongodb.connect(settings.url, function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if (err) {
				db.close();
				return callback(err);
			}
			// 更新文章的内容，此处注意是time.day，不是day
			collection.update({
				"name": name,
				"time.day": day,
				"title": title
			}, {
				$set: {
					post: post
				}
			}, function(err) {
				db.close();
				if (err) {
					return callback(err);
				}
				callback(null);
			})
		})
	})
}

//删除一篇文章
Post.remove = function(name, day, title, callback) {
	//打开数据库
	mongodb.connect(settings.url, function(err, db) {
		if (err) {
			return callback(err);
		}
		//读取 posts 集合
		db.collection('posts', function(err, collection) {
			if (err) {
				db.close();
				return callback(err);
			}
			//查询要删除的文档
			collection.findOne({
				"name": name,
				"time.day": day,
				"title": title
			}, function(err, doc) {
				if (err) {
					db.close();
					return callback(err);
				}
				//如果有 reprint_from，即该文章是转载来的，先保存下来 reprint_from
				var reprint_from = "";
				if (doc.reprint_info.reprint_from) {
					reprint_from = doc.reprint_info.reprint_from;
				}
				if (reprint_from != "") {
					//更新原文章所在文档的 reprint_to
					collection.update({
						"name": reprint_from.name,
						"time.day": reprint_from.day,
						"title": reprint_from.title
					}, {
						$pull: {
							"reprint_info.reprint_to": {
								"name": name,
								"day": day,
								"title": title
							}
						}
					}, function(err) {
						if (err) {
							db.close();
							return callback(err);
						}
					});
				}

				//删除转载来的文章所在的文档
				collection.remove({
					"name": name,
					"time.day": day,
					"title": title
				}, {
					w: 1
				}, function(err) {
					db.close();
					if (err) {
						return callback(err);
					}
					callback(null);
				});
			});
		});
	});
};

// 寻找tags
Post.getTags = function(callback) {
	mongodb.connect(settings.url, function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if (err) {
				db.close();
				return callback(err);
			}
			collection.distinct('tags', function(err, docs) {
				db.close();
				if (err) {
					return callback(err);
				}
				return callback(null, docs);
			});
		});
	});
}

Post.getTag = function(tag, callback) {
	mongodb.connect(settings.url, function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if (err) {
				db.close();
				return callback(err);
			}
			//查询所有 tags 数组内包含 tag 的文档
			//并返回只含有 name、time、title 组成的数组
			collection.find({
				"tags": tag
			}, {
				"name": 1,
				"title": 1,
				"time": 1
			}).sort({
				time: -1
			}).toArray(function(err, docs) {
				db.close();
				if (err) {
					return callback(err);
				}
				return callback(null, docs);
			});
		});
	});
}

Post.search = function(keyword, callback) {
	mongodb.connect(settings.url, function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if (err) {
				db.close();
				return callback(err);
			}
			var pattern = new RegExp("^.*" + keyword + ".*$", "i");
			collection.find({
				"title": pattern
			}, {
				"name": 1,
				"time": 1,
				"title": 1
			}).sort({
				time: -1
			}).toArray(function(err, docs) {
				db.close();
				if (err) {
					return callback(err)
				}
				callback(null, docs);
			})
		})
	})
}

Post.reprint = function(reprint_from, reprint_to, callback) {
	mongodb.connect(settings.url, function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if (err) {
				db.close();
				return callback(err);
			}
			collection.findOne({
				"name": reprint_from.name,
				"title": reprint_from.title,
				"time.day": reprint_from.day
			}, function(err, doc) {
				if (err) {
					db.close();
					return callback(err);
				}

				var date = new Date();
				var time = {
					date: date,
					year: date.getFullYear(),
					month: date.getFullYear() + "-" + (date.getMonth() + 1),
					day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
					minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
						date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
				}

				delete doc._id;
				doc.name = reprint_to.name;
				doc.head = reprint_to.head;
				doc.time = time;
				doc.title = (doc.title.search(/[转载]/) > -1) ? doc.title : "[转载]" + doc.title;
				doc.comments = [];
				doc.reprint_from = {
					"reprint_from": reprint_from
				};
				doc.pv = 0;

				//更新被转载的原文档的 reprint_info 内的 reprint_to
				collection.update({
					"name": reprint_from.name,
					"time.day": reprint_from.day,
					"title": reprint_from.title
				}, {
					$push: {
						"reprint_info.reprint_to": {
							"name": doc.name,
							"day": time.day,
							"title": doc.title
						}
					}
				}, function(err) {
					if (err) {
						db.close();
						return callback(err);
					}
				});

				//将转载生成的副本修改后存入数据库，并返回存储后的文档
				collection.insert(doc, {
					safe: true
				}, function(err, post) {
					db.close();
					if (err) {
						return callback(err);
					}
					callback(err, post[0]);
				});
			});
		});
	});
}