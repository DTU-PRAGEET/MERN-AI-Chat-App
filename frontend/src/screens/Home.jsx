import React, { useContext, useState, useEffect } from 'react'
import { UserContext } from '../context/user.context.jsx';
import axios from '../config/axios.js';
import { useNavigate } from 'react-router-dom';


const Home = () => {
    
    const { user } = useContext(UserContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [projectName, setProjectName] = useState(null);
    const [project, setProject] = useState([]);

    const navigate = useNavigate();

    function createProject(e){
        e.preventDefault();
        console.log({projectName});

        axios.post('/projects/create', {
            name: projectName
        }).then((res) => {
            console.log(res);
            setIsModalOpen(false);
            // setProjectName(null);
        }).catch((err) => {
            console.log(err);
        });
    }

    useEffect(() => {
        axios.get('/projects/all')
            .then((res) => {
                setProject(res.data.projects);
            })
            .catch((err) => {
                console.error(err);
            });
    }, []);

    return (
        <main className='p-4'>
            <div className="projects flex flex-wrap gap-3">
                <button 
                onClick={(e) => {
                    // e.preventDefault();
                    setIsModalOpen(true);
                }}
                className="projects p-4 border border-slate-400 rounded-md">
                    <i className="ri-link mr-2"></i>New Project
                </button>

                {
                    project.map((project) => (
                        <div key={project._id} 
                        onClick={(e) => {
                            // e.preventDefault();
                            navigate(`/project`, {
                                state: { project }
                            });
                        }}
                        className='projects flex flex-col gap-2  cursor-pointer p-4 border border-slate-400 rounded-md min-w-52 hover:bg-slate-200'>
                            <h2 className='font-semibold'>{project.name}</h2>
                            <div className='flex gap-2 '>
                                <p><small><i className="ri-user-line mr-1"></i></small><small>Collaborators</small> :</p>
                                {project.users.length}
                            </div>
                        
                        </div>
                    ))
                }
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h2 className="text-xl font-bold mb-4">Create New Project</h2>
                        <form onSubmit={createProject}>
                            <input
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)} 
                                type="text" 
                                placeholder="Project Name"
                                className="w-full p-2 border border-gray-300 rounded mb-4"
                            />
                            <div className="flex justify-end gap-2">
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    )
}

export default Home