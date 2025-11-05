import { useEffect, useMemo, useState } from 'react'
import './banner.less'
import hot1 from '../../assets/hot1.png'
import hot2 from '../../assets/hot2.png'
import hot3 from '../../assets/hot3.png'
import hot4 from '../../assets/hot4.png'
import Recommend from '../Recommend'
const Banner = () => {
    const images = useMemo(() => [hot1, hot2, hot3, hot4], [])
    const [index, setIndex] = useState(0)

    useEffect(() => {
        const id = setInterval(() => {
            setIndex((prev) => (prev + 1) % images.length)
        }, 3500)
        return () => clearInterval(id)
    }, [images.length])

    const goTo = (i) => setIndex(i)
    const prev = () => setIndex((i) => (i - 1 + images.length) % images.length)
    const next = () => setIndex((i) => (i + 1) % images.length)

    return (
        <div className="banner-wrap">
            <div className="banner">
                <div
                    className="banner__track"
                    style={{ transform: `translateX(-${index * 100}%)` }}
                >
                    {images.map((src, i) => (
                        <div className="banner__slide" key={i}>
                            <img className="banner__image" src={src} alt={`Slide ${i + 1}`} />
                        </div>
                    ))}
                </div>

                <button className="banner__arrow banner__arrow--left" onClick={prev} aria-label="Previous">
                    ‹
                </button>
                <button className="banner__arrow banner__arrow--right" onClick={next} aria-label="Next">
                    ›
                </button>

                <div className="banner__dots">
                    {images.map((_, i) => (
                        <button
                            key={i}
                            className={`banner__dot ${i === index ? 'banner__dot--active' : ''}`}
                            onClick={() => goTo(i)}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>
            </div>
            <div className="recommend">
                <Recommend />
            </div>
        </div>
    )
}

export default Banner
