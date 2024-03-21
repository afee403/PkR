const app = getApp();
const user_info = JSON.parse(wx.getStorageSync('user'));
const medals_All = require('../../../utils/medals_all');

Page({

    /**
     * 页面的初始数据
     */
    data: {
        isShowloading: true,
        medal: [],
        medals_all: [],
        user: {},
        medal_data: "",
        time_at_now: null,
        time_start: null,
        time_end: null
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (option) {
        this.setData({ user: user_info});
        this.setData({ medals_all: medals_All });
        this.requestData(this.data.user.rid)
        let medal_meid;
        if (option != null) {
          this.setData({ medal_data: option.medal});
          medal_meid = JSON.parse(option.medal);
          wx.setStorageSync('meid', JSON.stringify(medal_meid));
        }
        else {
          medal_meid = wx.getStorageSync('meid');
        }
        for (let k = 0; k < this.data.medals_all.length; k++) {
          if (this.data.medals_all[k][0].meid == medal_meid) {
            this.setData({medal: this.data.medals_all[k]});
            break;
          }
        }
        this.setData({
          time_start: this.formatDate(this.data.medal[0].getable),
          time_end: this.formatDate(this.data.medal[0].ungetable)
        })
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    },

    //获取个人勋章数据
    requestData(rid) {
        return new Promise((resolve, reject)=>{
            wx.request({
                url: app.config.getHostUrl()+'/api/user/getMedal',
                data: { rid },
                method: 'POST',
                success: (result)=>{
                    if(result.data.isSuccess){
                        resolve(result.data.data);
                    }else{
                        reject(result.data.msg);
                    }
                },
                fail: ()=>{},
                complete: ()=>{}
            });
        })
    },

    // 处理勋章数据
    parseMedals(medals) {
      if(medals == []) return medals;
      let nmedals = [];
      for (let i = 0; i < medals.length; i++) {
          // if (medals[i] == undefined) continue;
          let outer = medals[i];
          let item = [outer];
          nmedals.push(item);
          for (let k = 0; k < this.data.medals_all.length; k++){
              if (this.data.medals_all[k][0].mkey == item[0].mkey) {
                this.data.medals_all[k][0].type = 1;
                this.data.medals_all[k][0].created_at = item[0].created_at;
                break;
              }
          } 
      }
      return nmedals;
    },

    // 获取徽章
    getMedal() {
      let that = this;
      let user = that.data.user;
      if(this.data.user.pkuid != null) {
        this.setData({time_at_now: Date.parse(new Date())});
        if (this.data.time_at_now > that.data.medal[0].getable && time_at_now < that.data.medal[0].ungetable) {
          return new Promise((resolve, reject)=>{
            wx.request({
                url: app.config.getHostUrl()+'/api/user/lightMedal',
                data: { 
                  "rid": this.data.user.rid,
                  "meid": this.data.medal[0].meid
                },
                method: 'POST',
                success: (result)=>{
                    if(result.data.isSuccess){
                        resolve(result.data.data);
                        this.data.medal[0].type = 1;
                    }else{
                        reject(result.data.msg);
                    }
                },
                fail: ()=>{},
                complete: ()=>{
                  wx.redirectTo({
                    url: '/pages/user/medals/medals?medal='+this.data.medal_data,
                  })
                }
            });
          })
        }
        else {
          wx.showModal({
            title: '提示',
            content: '未在可点亮时间',
            success (res) {
              if (res.confirm) {
                console.log('用户点击确定')
              } else if (res.cancel) {
                console.log('用户点击取消')
              }
            }
          })
        }
      }
      else {
        wx.showModal({
          title: '提示',
          content: '对不起，请先绑定您的学号',
          success (res) {
            if (res.confirm) {
              wx.navigateTo({
                url: '../edit/edit',
                events: {
                  // 获取被打开页面传送到当前页面的数据
                  whenUpdated: function(data) {
                    // console.log('修改成功返回的数据',data)
                    that.setData({ user: data })
                    wx.setStorageSync('user', data);
                  },
                },
                success: (res)=>{
                  res.eventChannel.emit('getDataFromUserPage', user)
                },
                fail: ()=>{},
                complete: ()=>{}
              });
              console.log('用户点击确定')
            } else if (res.cancel) {
              console.log('用户点击取消')
            }
          }
        })
      }
    },
    //时间戳转换方法    date:时间戳数字
    formatDate(date) {
      var date = new Date(date);
      var YY = date.getFullYear() + '-';
      var MM = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
      var DD = (date.getDate() < 10 ? '0' + (date.getDate()) : date.getDate());
      var hh = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':';
      var mm = (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':';
      var ss = (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds());
      return YY + MM + DD +" "+hh + mm + ss;
    },
    // 生成分享海报
    shareMedal() {
      wx.showModal({
        title: '提示',
        content: '未开发完成',
        success (res) {
          if (res.confirm) {
            console.log('用户点击确定')
          } else if (res.cancel) {
            console.log('用户点击取消')
          }
        }
      })
    }
})