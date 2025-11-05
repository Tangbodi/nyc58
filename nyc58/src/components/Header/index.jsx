import './header.less'
import logo from '../../assets/ny-special-care-logo.png'

const Header = () => {
  return (
    <header className="header">
      <div className="headerinside">
        <div className="header_left">
          <img src={logo} alt="NY Special Care" className="header__logo" />
        </div>
        <div className="header_right">
          <button className="header__button" type="button">免费发布</button>
        </div>
      </div>
    </header>
  )
}

export default Header
