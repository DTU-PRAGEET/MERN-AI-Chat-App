import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from '../config/axios.js'
import { UserContext } from '../context/user.context.jsx'

const Register = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const navigate = useNavigate()

    const { setUser } = useContext(UserContext)

    const [error, setError] = useState('')

    const submitHandler = (e) => {
        e.preventDefault()

        axios.post('/users/register',{
            email,
            password
        }).then((res) =>{
            console.log(res.data);

            localStorage.setItem('token', res.data.token);
            setUser(res.data.user);

            navigate('/');
        }).catch((err) => {
            console.error(err.response.data);
        });
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-3xl font-bold text-white mb-6 text-center">Register</h2>
                <form onSubmit={submitHandler } className="space-y-5">
                    <div>
                        <label className="block text-gray-300 mb-2" htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            className="w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2" htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            className="w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                        />
                    </div>
                    {error && <div className="text-red-400 text-sm">{error}</div>}
                    <button
                        type="submit"
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold transition"
                    >
                        Register
                    </button>
                </form>
                <p className="text-gray-400 mt-6 text-center">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-400 hover:underline">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default Register