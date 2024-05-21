using Microsoft.AspNetCore.SignalR;
using System;
using System.Threading.Tasks;

namespace LiveStreamApp.Hubs
{
    public class StreamHub : Hub
    {
        private static object _offer = null;

        public async Task SendOffer(object offer)
        {
            try
            {
                _offer = offer;
                Console.WriteLine("Offer stored: " + offer);
                await Clients.Others.SendAsync("receiveOffer", offer);
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error in SendOffer: " + ex.Message);
                throw;
            }
        }

        public async Task SendAnswer(object answer)
        {
            try
            {
                Console.WriteLine("Answer received: " + answer);
                await Clients.Others.SendAsync("receiveAnswer", answer);
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error in SendAnswer: " + ex.Message);
                throw;
            }
        }

        public async Task SendCandidate(object candidate)
        {
            try
            {
                Console.WriteLine("Candidate received: " + candidate);
                await Clients.Others.SendAsync("receiveCandidate", candidate);
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error in SendCandidate: " + ex.Message);
                throw;
            }
        }

        public async Task SendMessage(string user, object message)
        {
            try
            {
                if (user == "offer")
                {
                    _offer = message;
                    Console.WriteLine("Offer stored: " + message);
                }
                await Clients.All.SendAsync("ReceiveMessage", user, message);
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error in SendMessage: " + ex.Message);
                throw;
            }
        }

        public Task<object> GetOffer()
        {
            try
            {
                Console.WriteLine("GetOffer called. Current offer: " + _offer);
                return Task.FromResult(_offer);
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error in GetOffer: " + ex.Message);
                return Task.FromResult<object>(null);
            }
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            try
            {
                if (_offer != null)
                {
                    _offer = null;
                    Console.WriteLine("Offer cleared.");
                }
                await base.OnDisconnectedAsync(exception);
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error in OnDisconnectedAsync: " + ex.Message);
                throw;
            }
        }
    }
}
