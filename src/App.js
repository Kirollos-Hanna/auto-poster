import Close from './icons/close';
import Minimize from './icons/minimize';
import Maximize from './icons/maximize';
import Maximize2 from './icons/maximize2';
import MenuFold from './icons/menuFold';
import MenuUnfold from './icons/menuUnfold';
import AddCircle from './icons/addCircle';
import PieChart from './icons/pieChart';
import Settings from './icons/settings';
import Home from './icons/home';
import { appWindow } from '@tauri-apps/api/window'
import { useState } from 'react'
import { NavLink, Outlet } from "react-router-dom";
import './App.css';

function App() {
  let [maximizeToggle, setMaximizeToggle] = useState(false);
  let [foldSideBar, setFoldSideBar] = useState(false);
  let [sideNavWidth, setSideNavWidth] = useState(300);
  let [navMenuItemStyle, setNavMenuItemStyle] = useState({
    paddingLeft: foldSideBar ? '0' : '24px',
    justifyContent: foldSideBar ? 'center' : 'flex-start',
    paddingTop: foldSideBar ? '16px' : '',
    width: foldSideBar ? '101%' : '93%',
  });

  const toggleMaximize = () => {
    appWindow.toggleMaximize()
    setMaximizeToggle(!maximizeToggle);
  }

  const toggleFoldSideBar = () => {
    setNavMenuItemStyle({
      paddingLeft: !foldSideBar ? '0' : '24px',
      justifyContent: !foldSideBar ? 'center' : 'flex-start',
      paddingTop: !foldSideBar ? '16px' : '',
      width: !foldSideBar ? '101%' : '93%',
    });
    setFoldSideBar(!foldSideBar);
    setSideNavWidth(sideNavWidth === 300 ? 80 : 300);
  }

  return (
    <div className="App">
      <div data-tauri-drag-region className="titlebar">
        <div onClick={toggleFoldSideBar} className="fold-button">
          {foldSideBar ? <MenuFold /> : <MenuUnfold />}
        </div>
        <div>
          <div onClick={() => appWindow.minimize()} className="titlebar-button" id="titlebar-minimize">
            <Minimize />
          </div>
          <div onClick={toggleMaximize} className="titlebar-button" id="titlebar-maximize">
            {maximizeToggle ? <Maximize2 /> : <Maximize />}
          </div>
          <div onClick={() => appWindow.close()} className="titlebar-button" id="titlebar-close">
            <Close />
          </div>
        </div>
      </div>

      <div className="App-header">
        <nav style={{ minWidth: (sideNavWidth + 'px') }} className="navigation-tab">
          <NavLink to="/" style={navMenuItemStyle}

            className={({ isActive }) => (isActive ? "selected-menu-item" : "") + " pad-top-item menu-item"}>
            <Home />
            {!foldSideBar && <p>Home</p>}
          </NavLink>
          <NavLink to="/create"
            style={navMenuItemStyle}
            className={({ isActive }) => (isActive ? "selected-menu-item" : "") + " menu-item"}
          >
            <AddCircle />
            {!foldSideBar && <p>Create</p>}
          </NavLink>
          <NavLink to="/metrics" style={navMenuItemStyle}
            className={({ isActive }) => (isActive ? "selected-menu-item" : "") + " menu-item"}
          >
            <PieChart />
            {!foldSideBar && <p>Metrics</p>}
          </NavLink>
          <NavLink to="/settings" style={navMenuItemStyle}
            className={({ isActive }) => (isActive ? "selected-menu-item" : "") + " menu-item"}
          >
            <Settings />
            {!foldSideBar && <p>Settings</p>}
          </NavLink>
        </nav>
        <div style={{ width: 'calc(100% - ' + sideNavWidth + 'px)' }} className='content-container'>

          <Outlet />

        </div>
      </div>
    </div>
  );
}

export default App;
