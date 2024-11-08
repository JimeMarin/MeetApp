// SendEmail.js
import emailjs from '@emailjs/browser';
import { getCurrentUser } from './AuthUtils';

export const sendEmails = async (booking, isCancellation = false) => {
    console.log("sendEmails called. Attendees:", booking.attendees);
   
    if (!booking || !booking.attendees) {
        console.error("Invalid booking data:", booking);
        return;
      }
    
      console.log("sendEmails called. Attendees:", booking.attendees);
      const currentUser = getCurrentUser();
      
      if (!currentUser) {
        console.error('No user is currently logged in');
        return;
      }
    
    console.log('Current user:', currentUser);
    console.log('Booking details:', booking);
  
    // Asegúrate de que la fecha se maneje correctamente
    const bookingDate = new Date(booking.date);
    bookingDate.setMinutes(bookingDate.getMinutes() + bookingDate.getTimezoneOffset());
    
    const formattedDate = bookingDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    });
  
    const subject = isCancellation 
    ? `Cancellation: Room Booking for ${booking.room}`
    : `Room Booking: ${booking.room}`;

  const message = isCancellation
    ? `Your booking for ${booking.room} on ${new Date(booking.date).toLocaleDateString()} has been cancelled.`
    : booking.message;
  
    const templateParams = {
      from_name: currentUser.name,
      from_email: currentUser.email,
      to_email: booking.attendees.join(', '),
      subject: subject,
      message: message,
      room: booking.room,
      date: formattedDate,
      start_time: booking.startTime,
      end_time: booking.endTime,
    };
  
    console.log('Email template params:', templateParams);
  
    try {
      console.log("Attempting to send email with EmailJS");
      const result = await emailjs.send(
        'service_ufvxwq5',
        'template_vzpjouz',
        templateParams,
        'p1yL7ZtB9h0RV17-X'
      );
      console.log('Email sent successfully:', result.text);
      console.log('Email status:', result.status);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };