import React, { useState } from "react";
import { makePayment } from "./api";

function App() {
    const [amount, setAmount] = useState(1000);

    const handlePayment = async () => {
        const response = await makePayment(amount);
        alert("Payment Intent Created: " + response.clientSecret);
    };

    return (
        <div>
            <h1>Custom Packaging Store</h1>
            <button onClick={handlePayment}>Pay Now</button>
        </div>
    );
}

export default App;


// import axios from "axios";

// export const makePayment = async (amount) => {
//     const response = await axios.post("/api/payment", { amount });
//     return response.data;
// };
