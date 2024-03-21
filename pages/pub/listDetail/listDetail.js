import Dialog from '@vant/weapp/dialog/dialog';

const app = getApp();
let user = app.getUser();
let acid = 0
Page({

  /**
   * 页面的初始数据
   */
  data: {
    listDetail: {},
    activity_date: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    let that = this;
    acid = options;
    user = app.getUser();
    this.getListDetail();
  },
  
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {
    
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  // 获取活动详情
  getListDetail() {
    let that = this;
    wx.request({
      url: app.config.getHostUrl() + '/api/pub/getDetail',
      data: acid,
      success: (res) => {
        if (res.data.isSuccess) {
          let dateNow = Date.parse(new Date());
          res.data.data.content = res.data.data.content != null ? res.data.data.content.split("<br>") : res.data.data.content;
          that.setData({
            listDetail: res.data.data
          })
          that.setData({activity_date: that.data.listDetail.period.substring(0,11)})
        }
      },
    });
  }
  
})