import Chat from '../models/Chat.js';

export const getHistory = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const chats = await Chat.find({ roomId })
      .sort({ createdAt: 1 })
      .populate('senderId', 'name email');
    
    res.status(200).json(chats);
  } catch (error) {
    next(error);
  }
};
