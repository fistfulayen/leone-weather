async function test() {
  const response = await fetch('https://www.cryptopunks.app/cryptopunks/recents');
  const html = await response.text();

  // Test the pattern
  const salesPattern = /href="\/cryptopunks\/details\/(\d+)"[\s\S]*?Bought for ([\d.]+) ETH[\s\S]*?<div>(\d+) hours? ago<\/div>/gi;

  const sales = [];
  let match;

  while ((match = salesPattern.exec(html)) !== null) {
    const hoursAgo = parseInt(match[3]);
    if (hoursAgo <= 24) {
      sales.push({
        punkId: match[1],
        price: parseFloat(match[2]),
        hoursAgo: hoursAgo,
      });
    }
  }

  console.log('Found sales:', sales);

  if (sales.length > 0) {
    const totalVolume = sales.reduce((sum, sale) => sum + sale.price, 0);
    const avgPrice = totalVolume / sales.length;
    const highestSale = sales.reduce((max, sale) => sale.price > max.price ? sale : max, sales[0]);

    console.log({
      count: sales.length,
      totalVolume,
      avgPrice,
      highestSale
    });
  } else {
    console.log('No sales found in last 24 hours');

    // Try to find ANY "Bought for" pattern
    const anyBoughtPattern = /Bought for ([\d.]+) ETH/g;
    let anyMatch;
    let count = 0;
    while ((anyMatch = anyBoughtPattern.exec(html)) !== null) {
      console.log('Found "Bought for" pattern:', anyMatch[0]);
      count++;
      if (count > 5) break;
    }
  }
}

test();
