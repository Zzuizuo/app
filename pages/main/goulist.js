const TimeUtil = require('../../utils/TimeUtil.js');
const NumberUtil = require('../../utils/NumberUtil.js');
Page({
	data: {
		session: null,
		user: null,
		query: {
			keywords: '',
			from: null,
			size: 20
		}
	},
	onLoad(options) {
		let that = this;
		getApp().loadSession(function(session) {
			that.data.session = session;
			if (getApp().location) {
				that.setData({
					'query.location': getApp().location
				});
			}
			that.loadData();
		});
	},
	onReady() {},
	onShow() {},
	onPullDownRefresh() {
		if (this.data.session) {
			this.loadData(function() {
				wx.stopPullDownRefresh();
			});
		}
	},
	onReachBottom() {
		let that = this;
		if (that.data.nomore || that.data.loadingmore || !that.data.session || that.data.usergous.length == 0) {
			return;
		}
		that.data.query.from = that.data.usergous[that.data.usergous.length - 1].createTime;
		that.setData({
			loadingmore: true
		});
		that.loadData();
	},
	loadData: function(cb) {
		let that = this;
		if (that.data.loading) return;
		that.setData({ loading: true });
		getApp().request({
			url: '/userapp/main/usergous/load',
			data: { query: that.data.query },
			method: 'POST',
			success: function(res) {
				let user = res.data.user;
				let usergous = res.data.usergous;
				usergous.map((item) => {
					if (that.data.query.location) {
						item.gou.disStr =
							Number(NumberUtil.distance(that.data.query.location, item.gou.shop.location)).toFixed(1) +
							'km';
					}
					item.gou.recommendToIndex = true;
					item.createTimeStr = TimeUtil.orderTime(item.createTime);
				});
				if (that.data.query.from) {
					that.data.query.from = null;
					usergous = that.data.usergous.concat(usergous);
				}
				wx.setNavigationBarTitle({
					title: '抢购记录'
				});
				let nomore = res.data.usergous && res.data.usergous.length < that.data.query.size ? true : false;
				that.setData({
					session: that.data.session,
					user: user || null,
					usergous: usergous,
					loading: false,
					loadingmore: false,
					nomore
				});
				if (cb) cb();
			}
		});
	},
	handleSearchInputChange(e) {
		let keywords = e.detail.keywords;
		this.data.query.keywords = keywords;
		if (!keywords) {
			this.handleSearch();
		}
	},
	handleSearch() {
		let that = this;
		that.setData({
			usergous: [],
			'query.keywords': that.data.query.keywords
		});
		that.loadData();
	},
	toDetail: function(e) {
		let item = e.detail.item;
		wx.navigateTo({
			url: '/pages/gou/detail?gouId=' + item._id
		});
	}
});
