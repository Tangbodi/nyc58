import './category.less'

const categories = [
  { title: 'A', text: '最新活动与节日庆典' },
  { title: 'B', text: '纽约热门美食推荐' },
  { title: 'C', text: '房屋租赁与搬家服务' },
  { title: 'D', text: '教育与语言培训' },
  { title: 'E', text: '社区与本地新闻' },
  { title: 'F', text: '优惠与折扣信息' },
  { title: 'G', text: '休闲娱乐与夜生活' },
  { title: 'H', text: '宠物服务与用品' },
  { title: 'I', text: '医疗与健康护理' },
  { title: 'J', text: '汽车与维修服务' },
  { title: 'K', text: '招聘与兼职信息' },
  { title: 'L', text: '留学与签证咨询' },
  { title: 'M', text: '结婚与摄影服务' },
  { title: 'N', text: '家庭与育儿资源' },
  { title: 'O', text: '理财与保险规划' },
  { title: 'P', text: '科技与数码产品' },
]

const Categories = () => {
  return (
    <div className="categories">
      {categories.map((item, i) => (
        <div className="category-box" key={i}>
          <div className="category-title">{item.title}</div>
          <div className="category-text">{item.text}</div>
        </div>
      ))}
    </div>
  )
}

export default Categories

