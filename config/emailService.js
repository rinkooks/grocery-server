import http from 'http';
import nodemailer from 'nodemailer';

// configure the smtp transporter
const transporter = nodemailer.createTransport({
   host: 'smtp.gmail.com',  // e.g., 'smtp.gmail.com' for gmail
   post:465,   // or 465 for secure
   secure:true,  // true for port 465, false for other ports
   auth:{
     user: process.env.EMAIL,  // your smtp usernamr
     pass: process.env.EMAIL_PASS  // SMTP PASSWORD
   }

})

// function to send email
async function sendEmail(to, subject, text, html) {
  try{
    const info = await transporter.sendMail({
      from: process.env.EMAIL,  //sender address
      to, //list of recievers
      subject, // subject line
      text, // plain text today
      html, // html body
    });
   return { success:true, messageId: info.messageId }; 
  }catch(error){
    console.error('Error sending email:', error);
    return { success:false, error: error.message}
  }
}

export {sendEmail};