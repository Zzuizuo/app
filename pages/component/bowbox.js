Component({
	behaviors: [],
	properties: {
		item: Object,
		query: Object // 简化的定义方式
	},
	options: {
		styleIsolation: 'apply-shared',
		multipleSlots: true // 在组件定义时的选项中启用多slot支持
	},
	data: {}, // 私有数据，可用于模板渲染
	lifetimes: {
		// 生命周期函数，可以为函数，或一个在methods段中定义的方法名
		attached: function() {},
		moved: function() {},
		detached: function() {}
	},
	// 生命周期函数，可以为函数，或一个在methods段中定义的方法名
	attached: function() {}, // 此处attached的声明会被lifetimes字段中的声明覆盖
	ready: function() {},
	pageLifetimes: {
		// 组件所在页面的生命周期函数
		show: function() {},
		hide: function() {},
		resize: function() {}
	},
	methods: {
		onBow(e) {
			let item = e.currentTarget.dataset.item;
			this.triggerEvent('onbow', { item }, {});
		},
		onActions(e) {
			let item = e.currentTarget.dataset.item;
			this.triggerEvent('onactions', { item }, {});
		}
		// 内部方法建议以下划线开头
	}
});
