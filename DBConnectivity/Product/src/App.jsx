import { useEffect, useState } from "react";
import img1 from "./assets/img1.jpg";
import img2 from "./assets/img2.jpg";
import img3 from "./assets/img3.jpg";
import img4 from "./assets/img4.jpg";
import img5 from "./assets/img5.jpg";


function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/products")
      .then((response) => response.json())
      .then((data) => {
        setProducts(data);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  const addToCart = (product) => {
    setCart([...cart, product]);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      
      <nav className="shadow-md sticky top-0 z-50 bg-amber-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center"> 
           <div className="flex-1 flex justify-center gap-8 ">

            <a
              href="#home"
              className="text-gray-700 font-medium hover:text-blue-600"
            >
              Home |
            </a>

            <a
              href="#products"
              className="text-gray-700 font-medium hover:text-blue-600"
            >
              Products |
            </a>

            <a
              href="#about"
              className="text-gray-700 font-medium hover:text-blue-600"
            >
              About |
            </a>

            <a
              href="#services"
              className="text-gray-700 font-medium hover:text-blue-600"
            >
              Services |
            </a>

            <a
              href="#contact"
              className="text-gray-700 font-medium hover:text-blue-600"
            >
              Contact Us 
            </a>

          </div>

        </div>
      </nav>


     
      <section id="home" className="bg-blue-100">

        <div className="max-w-6xl mx-auto px-6 py-16">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">

            {/* Text */}
            <div>

              <p className="text-blue-600 font-semibold mb-3">
                WELCOME TO SMARTBUY
              </p>

              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight">
                Shop Smart.
                <br />
                Buy Better.
              </h2>

              <p className="text-gray-600 text-lg mt-5">
                Find quality products at affordable prices.
                Shop your favorite products easily with SmartBuy.
              </p>

              <a
                href="#products"
                className="inline-block mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                Shop Now
              </a>

            </div>

            {/* Image */}
            <div className="flex justify-center">

              <img
                src={img3}
                alt="SmartBuy"
                className="w-full max-w-md h-72 object-contain"
              />

            </div>

          </div>

        </div>

      </section>


     
      <section
        id="products"
        className="max-w-6xl mx-auto px-6 py-14"
      >

        <div className="text-center mb-8">

          <h2 className="text-3xl font-bold text-gray-800">
            Our Products
          </h2>

          <p className="text-gray-500 mt-2">
            Explore our latest products
          </p>

        </div>


        {products.length === 0 ? (

          <p className="text-center text-gray-500">
            Loading products...
          </p>

        ) : (

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {products.map((product) => (

              <div
                key={product.id}
                className="bg-white rounded-lg shadow-md p-5 hover:shadow-xl transition"
              >

               
                <div className="bg-gray-100 rounded-lg p-4">

                  <img
                    src={
                    product.name === "Laptop" 
                    ? img1
                    : product.name === "Smartphone"
                    ? img2
                    : product.name === "Shirt"
                    ? img4
                    : product.name === "Shoes"
                    ? img5
                   : img2
                   }
                    alt={product.name}
                    className="w-full h-52 object-contain"
                  />

                </div>


                
                <h3 className="text-xl font-bold text-center mt-4">
                  {product.name}
                </h3>

                
                <p className="text-xl font-semibold text-green-600 text-center mt-2">
                  ₹{product.price}
                </p>

                <button
                  onClick={() => addToCart(product)}
                  className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Add to Cart
                </button>

              </div>

            ))}

          </div>

        )}

      </section>


     
      <section id="about" className="bg-white py-14">

        <div className="max-w-5xl mx-auto px-6 text-center">

          <h2 className="text-3xl font-bold text-gray-800">
            About SmartBuy
          </h2>

          <p className="text-gray-600 mt-4 leading-7">
            SmartBuy is an online shopping website where customers
            can easily explore and purchase different products.
            Our goal is to provide quality products at affordable prices.
          </p>

        </div>

      </section>


      
      <section id="services" className="bg-blue-50 py-14">

        <div className="max-w-6xl mx-auto px-6">

          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Our Services
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div className="bg-white p-6 rounded-lg shadow text-center">
             
              <h3 className="font-bold text-xl mt-3">
                Fast Delivery
              </h3>

              <p className="text-gray-500 mt-2">
                Quick and safe delivery to your doorstep.
              </p>
            </div>


            <div className="bg-white p-6 rounded-lg shadow text-center">
              

              <h3 className="font-bold text-xl mt-3">
                Easy Payment
              </h3>

              <p className="text-gray-500 mt-2">
                Simple and convenient payment options.
              </p>
            </div>


            <div className="bg-white p-6 rounded-lg shadow text-center">
             
               <h3 className="font-bold text-xl mt-3">
                Customer Support
              </h3>

              <p className="text-gray-500 mt-2">
                We are always ready to help our customers.
              </p>
            </div>

          </div>

        </div>

      </section>


     
      <section id="contact" className="bg-white py-14">

        <div className="max-w-3xl mx-auto px-6 text-center">

          <h2 className="text-3xl font-bold text-gray-800">
            Contact Us
          </h2>

          <div className="mt-6 space-y-2 text-gray-600">
            <p>Email: smartbuy@gmail.com</p>
            <p>Phone: +91 98765 43210</p>
            <p>Location: Maharashtra, India</p>
          </div>

        </div>

      </section>


     
      <footer className="bg-blue-600 text-white text-center py-6">

        <h3 className="text-xl font-bold">
          🛍️ SmartBuy
        </h3>

        <p className="mt-2 text-sm">
          Online Shopping Website
        </p>

        <p className="mt-2 text-sm">
          © 2026 SmartBuy 
        </p>

      </footer>

    </div>
  );
}

export default App;
