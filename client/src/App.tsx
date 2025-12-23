import Board from "./Pages/board.tsx";
import Home from "./Pages/Home.tsx";
import Slides from './Pages/Slides.tsx';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import {Toaster} from 'react-hot-toast';
export const App = () => {
  return (
    <div>
        <BrowserRouter>
          <Toaster position="top-center"/>
            <Routes>
            <Route path="/" element={<Home/>}></Route>
            <Route path="/board/:boardId" element={<Board/>}></Route>
            <Route path='/board/:boardId/slides' element={<Slides/>}></Route>
          </Routes>
        </BrowserRouter>   
    </div>
  )
}
