'use strict'
// 全局声明侧栏插件代号
const pluginname = 'hexo_butterfly_notice'
// 全局声明依赖
const pug = require('pug')
const path = require('path')
const urlFor = require('hexo-util').url_for.bind(hexo)
const util = require('hexo-util')

// 先来编写侧栏插件，使用容器注入式开发模板

hexo.extend.filter.register('after_generate', function (locals) {
  // 首先获取整体的配置项名称
  const config = hexo.config.notice || hexo.theme.config.notice
  // 如果配置开启
  if (!(config && config.enable)) return
  // 集体声明配置项
    const data = {
      enable_page: config.enable_page ? config.enable_page : "all",
      layout_type: config.layout.type,
      layout_name: config.layout.name,
      layout_index: config.layout.index ? config.layout.index : 0,
      path: config.path ? "/" + config.path + "/" : "/notice/",
      //exclude: config.exclude ? config.exclude : "/notice/",
      //appId: config.appId,
      //appKey: config.appKey,
      //option: config.option ? JSON.stringify(config.option) : false,
      custom_css: config.custom_css ? urlFor(config.custom_css) : "https://cdn.jsdelivr.net/gh/sao-coding/blog-cdn/hexo-butterfly-notice/notice.min.css",
      //custom_js: config.custom_js ? urlFor(config.custom_js) : "https://cdn.jsdelivr.net/npm/swiper/swiper-bundle.min.js"
    }
  // 渲染页面
  const temple_html_text = config.temple_html ? config.temple_html : pug.renderFile(path.join(__dirname, './lib/html.pug'),data)

  //cdn资源声明
    //样式资源
  const css_text = `<link rel="stylesheet" href="${data.custom_css}" media="defer" onload="this.media='all'">`
    //脚本资源
  const js_text = `<script data-pjax src="https://cdn.jsdelivr.net/npm/swiper/swiper-bundle.min.js"></script> <script> new Swiper('.swiper-container', { direction: 'vertical', loop: true, autoplay: { delay: 3000, disableOnInteraction: true, } }) </script>`//`<script async src="${data.custom_js}"></script>`

  //注入容器声明
  var get_layout
  //若指定为class类型的容器
  if (data.layout_type === 'class') {
    //则根据class类名及序列获取容器
    get_layout = `document.getElementsByClassName('${data.layout_name}')[${data.layout_index}]`
  }
  // 若指定为id类型的容器
  else if (data.layout_type === 'id') {
    // 直接根据id获取容器
    get_layout = `document.getElementById('${data.layout_name}')`
  }
  // 若未指定容器类型，默认使用id查询
  else {
    get_layout = `document.getElementById('${data.layout_name}')`
  }
  // 挂载容器脚本
  // 此处在通用模板基础上，我们还需要加一条判断，保证不会在页面版再加载一个侧栏插件
  var user_info_js = `<script data-pjax>
  function ${pluginname}_injector_config(){
    var parent_div_git = ${get_layout};
    var item_html = '${temple_html_text}';
    console.log('已挂载${pluginname}');
    parent_div_git.insertAdjacentHTML("afterbegin",item_html);
    }
  var elist = '${data.exclude}'.split(',');
  var cpage = location.pathname;
  var epage = '${data.enable_page}';
  var flag = 0;

  for (var i=0;i<elist.length;i++){
    if (cpage.includes(elist[i])){
      flag++;
    }
  }

  if ((epage ==='all')&&(flag == 0)){
    ${pluginname}_injector_config();
  }
  else if (epage === cpage){
    ${pluginname}_injector_config();
  }
  </script>`
  // 注入用户脚本
  // 此处利用挂载容器实现了二级注入
  hexo.extend.injector.register('body_end', user_info_js, "default");
  // 注入脚本资源
  hexo.extend.injector.register('body_end', js_text, "default");
  // 注入样式资源
  hexo.extend.injector.register('head_end', css_text, "default");
},
hexo.extend.helper.register('priority', function(){
  // 过滤器优先级，priority 值越低，过滤器会越早执行，默认priority是10
  const pre_priority = hexo.config.artitalk.priority || hexo.theme.config.artitalk.priority
  const priority = pre_priority ? pre_priority : 10
  return priority
})
)

// 再是编写页面版插件，使用页面生成式模板
// 此处直接复用hexo-butterfly-notice的原代码
hexo.extend.generator.register('notice', function (locals) {
  const config = hexo.config.notice || hexo.theme.config.notice

  if (!(config && config.enable.page)) return

  const content = pug.renderFile(path.join(__dirname, './lib/page.pug'), page_data)

  const pathPre = config.path || 'notice'

  let pageDate = {
    content: content
  }

  if (config.front_matter) {
    pageDate = Object.assign(pageDate, config.front_matter)
  }

  return {
    path: pathPre + '/index.html',
    data: pageDate,
    layout: ['page', 'post']
  }
})