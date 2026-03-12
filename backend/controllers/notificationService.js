const cron = require('cron');
const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');
const Task = require('../models/Task');

class NotificationService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
    this.scheduleCron();
  }

  scheduleCron() {
    new cron.CronJob('*/5 * * * *', async () => {  // Every 5 min
      const now = new Date();
      const notifications = await Notification.find({ scheduled_at: { $lte: now }, status: 'pending' });
      for (let notif of notifications) {
        const task = await Task.findById(notif.task_id);
        // Send email or in-app
        await this.sendEmail(notif.user_id, `Reminder: ${task.title}`);
        notif.sent_at = now;
        notif.status = 'sent';
        await notif.save();
      }
    }).start();
  }

  async scheduleReminder(taskId, scheduledAt) {
    const notif = new Notification({ task_id: taskId, scheduled_at: scheduledAt, type: 'reminder' });
    await notif.save();
  }

  async sendEmail(userId, message) {
    const user = await User.findById(userId);
    await this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Daily Planner Reminder',
      text: message
    });
  }

  // sendPush, sendInApp (implement with WebSockets if needed)
}

module.exports = new NotificationService();