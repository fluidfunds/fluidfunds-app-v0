
export interface WalletData {
  socialName: string;
  address: string;
  totalValue: number;
  performance: number; // 24h performance
  last30dPerformance: number; // last 30 days performance
  rank: number;
  // Additional detail stats for presentation:
  performanceMetrics?: {
    dailyROI: number;
    weeklyROI: number;
    monthlyROI: number;
    maxDrawdown: number;
    sharpeRatio: number;
    winRate: number;
  };
  tags?: string[];
}

export async function fetchWalletDataForProfile(
  profile: { socialName: string; addresses: string[] }
): Promise<WalletData> {
  const primaryAddress = profile.addresses[0];
  
  // Set hardcoded detail stats based on the profile social name
  let totalValue: number;
  let performance: number;
  let last30dPerformance: number;
  let performanceMetrics = {
    dailyROI: 0,
    weeklyROI: 0,
    monthlyROI: 0,
    maxDrawdown: 0,
    sharpeRatio: 0,
    winRate: 0,
  };
  let tags: string[] = [];

  // Customize hardcoded stats for each profile
  switch (profile.socialName) {
    case 'basefreakz':
      totalValue = 120000;
      performance = 8;
      last30dPerformance = 18;
      performanceMetrics = { dailyROI: 0.8, weeklyROI: 3, monthlyROI: 8, maxDrawdown: 5, sharpeRatio: 1.5, winRate: 60 };
      tags = ['DeFi', 'Crypto'];
      break;
    case 'brycekrispy.eth':
      totalValue = 150000;
      performance = 12;
      last30dPerformance = 25;
      performanceMetrics = { dailyROI: 1.2, weeklyROI: 6, monthlyROI: 11, maxDrawdown: 4, sharpeRatio: 2.0, winRate: 70 };
      tags = ['NFT', 'Trader'];
      break;
    case 'bleu.eth':
      totalValue = 90000;
      performance = 6;
      last30dPerformance = 15;
      performanceMetrics = { dailyROI: 0.6, weeklyROI: 2.5, monthlyROI: 7, maxDrawdown: 6, sharpeRatio: 1.2, winRate: 55 };
      tags = ['Artist'];
      break;
    case 'maretus':
      totalValue = 200000;
      performance = 15;
      last30dPerformance = 30;
      performanceMetrics = { dailyROI: 1.5, weeklyROI: 7, monthlyROI: 13, maxDrawdown: 3, sharpeRatio: 2.5, winRate: 80 };
      tags = ['Investor'];
      break;
    case 'capybara':
      totalValue = 80000;
      performance = 7;
      last30dPerformance = 12;
      performanceMetrics = { dailyROI: 0.7, weeklyROI: 3.2, monthlyROI: 9, maxDrawdown: 7, sharpeRatio: 1.3, winRate: 65 };
      tags = ['Analyst'];
      break;
    case 'cojo.eth':
      totalValue = 110000;
      performance = 9;
      last30dPerformance = 20;
      performanceMetrics = { dailyROI: 0.9, weeklyROI: 4, monthlyROI: 10, maxDrawdown: 5, sharpeRatio: 1.7, winRate: 68 };
      tags = ['DeFi'];
      break;
    case 'renatov.eth':
      totalValue = 130000;
      performance = 10;
      last30dPerformance = 22;
      performanceMetrics = { dailyROI: 1.0, weeklyROI: 4.5, monthlyROI: 10.5, maxDrawdown: 4, sharpeRatio: 1.8, winRate: 72 };
      tags = ['Trader', 'Influencer'];
      break;
    case 'tylerfoust.eth':
      totalValue = 95000;
      performance = 11;
      last30dPerformance = 19;
      performanceMetrics = { dailyROI: 1.1, weeklyROI: 5, monthlyROI: 12, maxDrawdown: 5, sharpeRatio: 2.1, winRate: 75 };
      tags = ['NFT', 'Collector'];
      break;
    default:
      totalValue = 100000;
      performance = 10;
      last30dPerformance = 20;
      performanceMetrics = { dailyROI: 1, weeklyROI: 5, monthlyROI: 10, maxDrawdown: 5, sharpeRatio: 2.0, winRate: 70 };
      tags = [];
  }

  // The rank value will be updated later in the UI after sorting
  return Promise.resolve({
    socialName: profile.socialName,
    address: primaryAddress,
    totalValue,
    performance,
    last30dPerformance,
    rank: 0,
    performanceMetrics,
    tags,
  });
} 