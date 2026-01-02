import { useNavigate } from 'react-router-dom'
interface Slide {
  _id: string,
  boardId: string,
  slideNo: string,
  imageUrl: string,
}

interface GroupSlidesprops {
  slides: Slide[],
  boardId: string
}



const GroupSlides = ({ slides, boardId }: GroupSlidesprops) => {

  const navigate = useNavigate();
  const handleClick = () => {
    navigate(-1);
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-300">
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur border-b border-slate-200">
        <button onClick={handleClick} className="px-4 py-2 text-sm font-medium bg-gray-200 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100 transition">Back</button>

        <h1 className="text-xl md:text-2xl font-semibold text-slate-700 px-5 md:px-0">
          All slides of Board room <span className="text-red-500">{`${boardId}`}</span>
        </h1>

        <div className="w-[72px]" />
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {slides.map((slide) => (
            <div
              key={slide._id} 
              onClick={()=>{navigate(`/board/${boardId}`, {
                  state:{
                    imageurl: slide.imageUrl
                  }
              })}}
              className="group cursor-pointer rounded-xl bg-white shadow-sm hover:shadow-lg transition overflow-hidden border border-slate-200"
            >
              <img
                src={slide.imageUrl}
                alt="slide"
                className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    </div>

  )
}

export default GroupSlides;
