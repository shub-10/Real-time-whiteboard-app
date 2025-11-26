import Board from "./Pages/board.tsx";
import Home from "./Pages/Home.tsx";
import {BrowserRouter, Routes, Route} from 'react-router-dom';
export const App = () => {
  return (
    <div>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home/>}></Route>
            <Route path="/board/:boardId" element={<Board/>}></Route>
          </Routes>
        </BrowserRouter>   
    </div>
  )
}
