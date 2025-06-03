import mongoose from "mongoose";
import projectModel from "../models/project.model.js";

export const createProject = async ({ name, userId }) => {
    if(!name || !userId) {
        throw new Error("Project name and user ID are required");
    }

    let project;
    try{
        project = await projectModel.create({
            name,
            users: [userId]
        });
    } catch (error) {
        if(error.code === 11000) {
            throw new Error("Project name already exists");
        }
        throw error;
    }

    return project;
};


export const getAllProjectByUserId = async ({userId}) => {
    if(!userId) {
        throw new Error("User ID is required");
    }

    const allUserProjects = await projectModel.find({ users: userId });
    return allUserProjects;
};


export const addUserToProject = async ({ projectId, users, userId }) => {
    if(!projectId) {
        throw new Error("Project ID is required");
    }

    if(!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid ProjectId");
    }

    if(!users){
        throw new Error("Users are required");
    }

    if(!Array.isArray(users) || users.some(userId => !mongoose.Types.ObjectId.isValid(userId))) {
        throw new Error("Users must be an array of valid user IDs");
    }

    if(!userId) {
        throw new Error("User ID is required");
    }

    if(!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid UserId");
    }

    const project = await projectModel.findOne({
        _id: projectId,
        users: userId
    })
    if (!project) {
        throw new Error('user is not authorized to add users to this project');
    }

    const updatedProject = await projectModel.findOneAndUpdate({
        _id: projectId 
        },{
            $addToSet: { 
                users: { 
                    $each: users
                } 
            } 
        },{
        new:true
        });

    return updatedProject;
};


export const getProjectById = async ({ projectId }) => {
    if (!projectId) {
        throw new Error("projectId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid projectId")
    }


    const project = await projectModel.findOne({
        _id: projectId
    }).populate('users')

    return project;
}
