import React, { useState, useEffect, useContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom';
////// useLocation is used to access the current location object in your React component, which contains pathname, search, hash and state part of the URL.
////// state – Any state that was passed via navigation (like navigate('/project', { state: {...} }))
import axios from '../config/axios.js';
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket.js';
import { UserContext } from '../context/user.context.jsx';
import Markdown from 'markdown-to-jsx'; // Assuming you have a Markdown component for rendering markdown content
import { useRef } from 'react'; 
import { getWebContainer } from '../config/webContainer.js'; 

function SyntaxHighlightedCode(props) {
    const ref = useRef(null)

    React.useEffect(() => {
        if (ref.current && props.className?.includes('lang-') && window.hljs) {
            window.hljs.highlightElement(ref.current)

            // hljs won't reprocess the element unless this attribute is removed
            ref.current.removeAttribute('data-highlighted')
        }
    }, [ props.className, props.children ])

    return <code {...props} ref={ref} />
}


const Project = () => {

    const location = useLocation();
    const navigate = useNavigate();

    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState([]);
    const [project, setProject] = useState(location.state.project);
    const [message, setMessage] = useState('');
    const { user } = useContext(UserContext);

    const messageBox = React.createRef();

    const [users, setUsers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [fileTree, setFileTree] = useState({ });
    const [currentFile, setCurrentFile] = useState(null);
    const [openFiles, setOpenFiles] = useState([]);
    const [webContainer, setWebContainer] = useState(null);
    const [iframeUrl, setIframeUrl] = useState(null);
    const [runProcess, setRunProcess] = useState(null);


    function saveFileTree(ft) {
        axios.put('/projects/update-file-tree', {
            projectId: project._id,
            fileTree: ft
        }).then(res => {
            console.log(res.data)
        }).catch(err => {
            console.log(err)
        })
    }

    function WriteAiMessage(message) {

        const messageObject = JSON.parse(message)

        return (
            <div
                className='overflow-auto bg-slate-950 text-white rounded-sm p-2'
            >
                <Markdown
                    children={messageObject.text}
                    options={{
                        overrides: {
                            code: SyntaxHighlightedCode,
                        },
                    }}
                />
            </div>)
    }

    useEffect(() => {
        initializeSocket(project._id);

        if(!webContainer) {
            getWebContainer().then(container => {
                setWebContainer(container);
                console.log("Container started")
            });
        }

        receiveMessage('project-message', (data) => {

            const message = JSON.parse(data.message); 
            console.log(message);
            webContainer?.mount(message.fileTree);
            if(message.fileTree) {
                setFileTree(message.fileTree);
            }
            setMessages(prevMessages => [...prevMessages, data]);
        });

        axios.get(`/projects/get-project/${location.state.project._id}`).then(res => {

            console.log(res.data.project)

            setProject(res.data.project)
            setFileTree(res.data.project.fileTree || {});
        })


        axios.get('/users/all')
            .then(res => {
                setUsers(res.data.users);
            })
            .catch(error => {
                console.error('Error fetching users:', error);
            });
    }, []);

    const handleUserClick = (id) => {
        setSelectedUserId(prevSelectedUserId => {
            const newSelectedUserId = new Set(prevSelectedUserId);
            if (newSelectedUserId.has(id)) {
                newSelectedUserId.delete(id);
            } else {
                newSelectedUserId.add(id);
            }
            return newSelectedUserId;
        });
    }

    function addCollaborators() {

        axios.put("/projects/add-user", {
            projectId: location.state.project._id,
            users: Array.from(selectedUserId)
        }).then(res => {
            console.log(res.data)
            setIsModalOpen(false)

        }).catch(err => {
            console.log(err)
        })

    }

    function send(){

        sendMessage('project-message', {
            message,
            sender: user
        });

        // appendOutgoingMessage(message);
        setMessages(prevMessages => [...prevMessages, { message, sender: user }]);

        setMessage('');
    }

    function scrollToBottom(){
        messageBox.current.scrollTop = messageBox.current.scrollHeight;
    }

    return (
        <main className="h-screen w-screen flex">
            <section className="left relative flex flex-col h-screen min-w-96 bg-slate-300 ">
                <header className="flex justify-between items-center p-2 px-4 w-full bg-slate-100 absolute top-0 ">
                    <button
                        className="flex gap-2"
                        onClick={() => setIsModalOpen(true)}
                    >
                        <i className="ri-user-add-fill"></i>
                        <p>Add Collaborator</p>
                    </button>
                    <button
                        onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
                        className="p-2"
                    >
                        <i className="ri-group-fill"></i>
                    </button>
                </header>

                
                <div className="conversation-area pt-14 pb-10 flex-grow flex flex-col h-full relative">
                    <div 
                    ref={messageBox}
                    className="message-box p-1 flex-grow flex flex-col gap-1 overflow-auto max-h-full scrollbar-hide">
                    {messages.map((msg, index) => (
                            <div key={index} className={`${msg.sender._id === 'ai' ? 'max-w-80' : 'max-w-52'} ${msg.sender._id == user._id.toString() && 'ml-auto'}  message flex flex-col p-2 bg-slate-50 w-fit rounded-md`}>
                                <small className='opacity-65 text-xs'>{msg.sender.email}</small>
                                <div className='text-sm'>
                                    {msg.sender._id === 'ai' ?
                                        WriteAiMessage(msg.message)
                                        : <p>{msg.message}</p>}
                                </div>
                            </div>
                    ))}                    
                    </div>

                    <div className="inputField w-full flex justify-between absolute bottom-0">
                        <input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="p-2 px-4 border-none outline-none bg-white flex-grow rounded-4xl m-2 mr-1 cursor-pointer hover:bg-slate-100"
                            type="text"
                            placeholder="Enter message"
                        />
                        <button
                        onClick={ send }
                        className="px-3 m-2 ml-1 rounded-full bg-black cursor-pointer text-white">
                            <i className="ri-send-plane-fill"></i>
                        </button>
                    </div>
                </div> 


                <div className={`sidePanel min-w-96 h-full flex flex-col gap-2 bg-slate-50 absolute transition-all  ${
                        isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'
                    } top-0`}
                >
                    <header className="flex justify-between items-center px-4 p-2 bg-slate-200 ">
                        <h1 className='font-semibold text-lg'>Collaborators</h1>
                        <button onClick={() => setIsSidePanelOpen(false)}>
                            <i className="ri-close-fill"></i>
                        </button>
                    </header>
                    <div className="users flex flex-col gap-2 items-center">
                        
                        { project.users && project.users.map(user => {
                            return(
                                <div 
                                onClick={() => {
                                    navigate('/profile', { state: { user } })
                                }}
                                className="user cursor-pointer hover:bg-slate-200 flex gap-2 items-center p-2 w-full rounded-4xl">
                                    <div className="aspect-square rounded-full bg-slate-600 w-fit h-fit p-5 text-white flex justify-center items-center">
                                        <i className="ri-user-fill absolute"></i>
                                    </div>
                                    <h1 className="font-semibold text-lg ">{user.email}  </h1>
                                </div>
                            )
                        })}
                    </div>
                </div>
                
            </section>


            <section className='right bg-red-50 flex flex-grow h-full'>

                <div className="explorer h-full max-w-64 min-w-52 bg-slate-200">
                    <div className='file-tree w-full'>
                        {
                            Object.keys(fileTree).map((file, index) => (
                                <button
                                    onClick={() => {
                                        setCurrentFile(file);
                                        setOpenFiles([ ...new Set([ ...openFiles, file ])]);
                                    }}
                                    className="file-tree w-full">
                                    <div className="tree-element cursor-pointer p-2 px-4 flex items-center gap-2 bg-slate-300 w-full">
                                        <p className=' font-semibold text-lg'>{file}</p>
                                    </div>
                                </button>
                            ))
                        }
                    </div>
                </div>

            {/* {currentFile && ( */}
                <div className="code-editor flex flex-col flex-grow h-full ">
                    
                    <div className="top flex justify-between w-full">
                        
                        <div className="files flex">
                        {openFiles.map((file, index) => (
                            <button
                                key={index}
                                onClick={() => 
                                    setCurrentFile(file)
                                }
                                className={`open-file cursor-pointer p-2 px-4 flex items-center w-fit gap-2 bg-slate-300 ${currentFile === file ? 'bg-slate-400' : ''}`}>
                                <p
                                    className='font-semibold text-lg'
                                >{file}</p>
                            </button>

                        ))}
                        </div>

                        <div className="action flex gap-2"> 
                            <button
                            onClick={async () => {
                                await webContainer.mount(fileTree);
                                
                                const installProcess = await webContainer?.spawn('npm', ['install']);
                                installProcess.output.pipeTo(new WritableStream({
                                    write: (chunk) => {
                                        console.log(chunk);
                                    }
                                }));

                                if(runProcess) {
                                    runProcess.kill();
                                }
                                
                                let tempRunProcess = await webContainer?.spawn('npm', ['start']);
                                tempRunProcess.output.pipeTo(new WritableStream({
                                    write: (chunk) => {
                                        console.log(chunk);
                                    }
                                }));
                                setRunProcess(tempRunProcess);

                                webContainer.on('server-ready', (port, url) => {
                                    console.log('Port: ',port, 'URL: ', url);
                                    setIframeUrl(url);
                                });

                            }}
                            className='p-2 px-4 bg-slate-300 text-whiterounded-4xl items-center gap-2'
                            >
                                <i class="ri-play-large-fill"></i>
                            </button>
                        </div>
                    </div>

                    <div className="bottom flex flex-grow ">
                        {/* {fileTree[currentFile] && (
                            <textarea
                                value={fileTree[currentFile].content}
                                onChange={(e) => {
                                    console.log(e.target.value);
                                    setFileTree({
                                        ...fileTree,
                                        [currentFile]: {
                                            content: e.target.value
                                        }
                                    });
                                }}
                                className="w-full h-full p-4 bg-slate-100 outline-none border-none resize-none"
                            ></textarea>
                        )} */}


                        {
                            fileTree[currentFile] && (
                                <div className="code-editor-area h-full overflow-auto flex-grow bg-slate-50">
                                    <pre className="h-full">
                                        <code
                                            className="h-full outline-none"
                                            contentEditable
                                            suppressContentEditableWarning
                                            onBlur={(e) => {
                                                const updatedContent = e.target.innerText;
                                                const ft = {
                                                    ...fileTree,
                                                    [currentFile]: {
                                                        file: {
                                                          contents: updatedContent,
                                                        },
                                                    },
                                                };
                                                setFileTree(ft);
                                                saveFileTree(ft);
                                            }}
                                            style={{
                                                whiteSpace: 'pre-wrap',
                                                paddingBottom: '25rem',
                                                counterSet: 'line-numbering',
                                            }}
                                        >
                                            {fileTree[currentFile].file.contents}
                                        </code>
                                    </pre>
                                </div>
                        )}
                    </div>

                </div>

                {iframeUrl && webContainer && 
                    (<div className="flex min-w-96 flex-col h-full">
                        <div className="address-bar">
                            <input
                                type="text"
                                onChange={(e) => setIframeUrl(e.target.value)}
                                value={iframeUrl}
                                readOnly
                                className="w-full p-2 bg-slate-100 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <iframe src={iframeUrl} className='w-full h-full'></iframe>
                    </div>)
                }
            {/* )} */}


            </section>



            
            {/* Modal */}
                {/* {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center  bg-black bg-opacity-50">
                        <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-2 p-6 relative">
                            <button
                                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                                onClick={() => setIsModalOpen(false)}
                            >
                                <i className="ri-close-line text-2xl"></i>
                            </button>
                            <h2 className="text-xl font-semibold mb-4 text-center">Select a User</h2>
                            <ul className="space-y-2 max-h-64 overflow-y-auto ">
                                {usersList.map((user) => (
                                    <li
                                        key={user._id}
                                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition border ${
                                            selectedUserId === user._id
                                                ? 'bg-blue-100 border-blue-400'
                                                : 'bg-gray-50 hover:bg-blue-50 border-gray-200'
                                        }`}
                                        onClick={() => handleUserSelect(user._id)}
                                    >
                                        <div className="rounded-full bg-blue-500 text-white w-10 h-10 flex items-center justify-center font-bold text-lg">
                                            {user.name[0]}
                                        </div>
                                        <div>
                                            <div className="font-medium">{user.name}</div>
                                            <div className="text-xs text-gray-500">{user.email}</div>
                                        </div>
                                        {selectedUserId === user._id && (
                                            <i className="ri-check-line text-green-500 ml-auto text-xl"></i>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            <button className='absolute bottom-2 left-1/2 bg-blue-500 text-white p-3 rounded-4xl overflow-y-auto space-y-2' onClick={() => setIsModalOpen(false)}>
                                Add Collaborators
                            </button>
                        </div>
                    </div>
            )} */}


            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-4 rounded-md w-96 max-w-full relative">
                        <header className='flex justify-between items-center mb-4'>
                            <h2 className='text-xl font-semibold'>Select User</h2>
                            <button onClick={() => setIsModalOpen(false)} className='p-2'>
                                <i className="ri-close-fill"></i>
                            </button>
                        </header>
                        <div className="users-list flex flex-col gap-2 mb-12 max-h-96 overflow-auto">

                            {/* <ul className="space-y-2 max-h-64 overflow-y-auto ">
                                {usersList.map((user) => (
                                    <li
                                        key={user._id}
                                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition border ${
                                            selectedUserId === user._id
                                                ? 'bg-blue-100 border-blue-400'
                                                : 'bg-gray-50 hover:bg-blue-50 border-gray-200'
                                        }`}
                                        onClick={() => handleUserSelect(user._id)}
                                    >
                                        <div className="rounded-full bg-blue-500 text-white w-10 h-10 flex items-center justify-center font-bold text-lg">
                                            {user.name[0]}
                                        </div>
                                        <div>
                                            <div className="font-medium">{user.name}</div>
                                            <div className="text-xs text-gray-500">{user.email}</div>
                                        </div>
                                        {selectedUserId === user._id && (
                                            <i className="ri-check-line text-green-500 ml-auto text-xl"></i>
                                        )}
                                    </li>
                                ))}
                            </ul> */}

                            {users.map(user => (
                                <div key={user.id} className={`user cursor-pointer hover:bg-slate-200 ${Array.from(selectedUserId).indexOf(user._id) != -1 ? 'bg-slate-200' : ""} p-2 flex gap-2 items-center`} onClick={() => handleUserClick(user._id)}>
                                    <div className='aspect-square relative rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-slate-600'>
                                        <i className="ri-user-fill absolute"></i>
                                    </div>
                                    <h1 className='font-semibold text-lg'>{user.email}</h1>
                                </div>
                            ))}

                        </div>
                        <button
                            onClick={addCollaborators}

                            className='absolute bottom-2 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-blue-600 text-white rounded-4xl'>
                            Add Collaborators
                        </button>
                    </div>
                </div>
            )}




        </main>
    )
}

export default Project












































































