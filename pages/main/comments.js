const TimeUtil = require('../../utils/TimeUtil.js');
Page({
	/**
     * 页面的初始数据
     */
	data: {
		session: null,
		user: null,
		tab: 4,
		activeIndex: 0,
		navs: [
			{ name: '待点评', type: 4 },
			{ name: '待审核', type: 1 },
			{ name: '已通过', type: 2 },
			{ name: '未通过', type: 3 }
		],
		query: {
			keywords: '',
			from: null,
			size: 20
		}
	},

	/**
     * 生命周期函数--监听页面加载
     */
	onLoad: function(options) {
		let that = this;
		getApp().loadSession(function(session) {
			that.data.session = session;
			that.loadData();
		});
	},

	loadData: function(cb) {
		let that = this;
		if (that.data.loading) return;
		that.setData({ loading: true });
		getApp().request({
			url: '/userapp/main/comments/load',
			data: { tab: that.data.tab, query: that.data.query },
			method: 'POST',
			success: function(res) {
				let data = {
					loading: false,
					loadingmore: false
				};
				data.comments = res.data.comments || [];
				if (that.data.tab == 4) {
					data.comments = res.data.uncommentusercoupons || [];
				}
				if (that.data.query.from) {
					that.data.query.from = null;
					data.comments = that.data.comments.concat(data.comments);
				} else {
					data.session = that.data.session;
					data.user = res.data.user;
				}
				for (let comment of data.comments) {
					comment.createTimeStr = TimeUtil.orderTime(comment.createTime);
					if (comment.useTime) {
						comment.useTimeStr = TimeUtil.orderTime(comment.useTime);
					}
				}
				data.nomore = data.comments && data.comments.length < that.data.query.size ? true : false;
				that.setData(data);
				if (cb) cb();
			}
		});
	},

	/**
     * 页面相关事件处理函数--监听用户下拉动作
     */
	onPullDownRefresh: function() {
		if (this.data.user) {
			this.loadData(function() {
				wx.stopPullDownRefresh();
			});
		} else {
			wx.stopPullDownRefresh();
		}
	},

	/**
     * 页面上拉触底事件的处理函数
     */
	onReachBottom: function() {
		let that = this;
		if (that.data.nomore || that.data.loadingmore || !that.data.session || that.data.comments.length == 0) {
			return;
		}
		that.data.query.from = that.data.comments[that.data.comments.length - 1].createTime;
		that.setData({
			loadingmore: true
		});
		that.loadData();
	},

	/**
     * 用户点击右上角分享
     */
	onShareAppMessage: function() {},

	handleChangeNav(e) {
		this.setData({
			activeIndex: e.detail.index,
			tab: e.detail.item.type
		});
		this.loadData();
	},
	handleSearchInputChange(e) {
		let keywords = e.detail.keywords;
		this.data.query.keywords = keywords;
	},
	handleSearch() {
		let that = this;
		that.setData(
			{
				comments: [],
				'query.keywords': that.data.query.keywords
			},
			() => {
				that.loadData();
			}
		);
	},

	showActions: function(res) {
		let that = this;
		let i = res.detail.i;
		let item = res.detail.item;
		that.setData({ currentReplyIndex: i, replyModal: true, currentItem: item });
	},

	toReply: function() {
		let that = this;
		that.setData({ replyModal: true, currentReplyIndex: null, 'form.content': '' });
	},

	hideReplyModal: function() {
		let that = this;
		that.setData({ replyModal: false, currentReplyIndex: null });
	},
	replyChanged: function(e) {
		let that = this;
		that.setData({ 'form.content': e.detail.value });
	},
	replySubmit: function() {
		let that = this;
		if (!that.data.user.authed) {
			that.setData({ authModal: true });
		} else {
			that.submit();
		}
	},
	submit: function() {
		let that = this;
		if (that.data.loading) {
			return;
		}
		that.data.loading = true;
		getApp().request({
			url: '/userapp/main/comment/reply',
			data: { commentId: that.data.currentItem._id, form: that.data.form },
			method: 'POST',
			success: function(res) {
				that.data.loading = false;
				if (res.data.success) {
					that.setData({ replyModal: false });
					wx.showToast({
						title: '提交成功',
						icon: 'none'
					});
					that.loadData(); //TODO 可优化
				}
			}
		});
	},

	showImage: function(e) {
		let that = this;
		let item = e.currentTarget.dataset.item;
		console.log(item);
		let i = e.currentTarget.dataset.i;
		let urls = [];
		for (let image of item.images) {
			urls.push(image.url);
		}
		wx.previewImage({
			current: item.images[i].url,
			urls: urls
		});
	},
	replyClicked: function(res) {
		let that = this;
		let reply = res.detail.reply;
		let comment = res.detail.comment;
		let index = res.detail.index;
		let actions = [];
		if (that.data.user._id == reply.createBy._id) {
			actions.push('删除');
		} else {
			if (that.data.user._id != reply.createBy._id) {
				actions.push('回复');
			}
			if (that.data.user._id == comment.user._id) {
				actions.push('删除');
			}
			// if (that.data.user._id == comment.user._id) {
			//     actions.push('禁言')
			// }
			// actions.push('举报')
		}

		wx.showActionSheet({
			itemList: actions,
			success: function(r) {
				if (actions[r.tapIndex] == '删除') {
					getApp().request({
						url: '/userapp/main/comment/deleteReply',
						data: { commentId: comment._id, index: index },
						method: 'POST',
						success: function(res) {
							if (res.data.success) {
								that.loadData();
							}
						}
					});
				} else if (actions[r.tapIndex] == '回复') {
					let commentIndex = that.data.comments.indexOf(comment);
					that.data.currentItem = comment;
					that.setData({
						replyModal: true,
						currentReplyIndex: commentIndex,
						'form.content': '@' + reply.createBy.nickname + ' '
					});
				}
			}
		});
	},
	doNothing: function() {
		let that = this;
	},
	toShop: function(res) {
		let that = this;
		let item = res.detail.item;
		wx.navigateTo({
			url: '/pages/shop/detail?shopId=' + item.shop._id + '&fromCommentId=' + item._id
		});
	},
	toComment(e) {
		let item = e.currentTarget.dataset.item;
		wx.navigateTo({
			url: '/pages/main/comment?shopId=' + item.coupon.shop._id + '&usercouponId=' + item._id
		});
	}
});
