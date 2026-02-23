async function loadMenu() {
  try {
    const response = await fetch(
      "https://opensheet.elk.sh/1rqjCfmiDGdfvs3XKn0PaVx6wWy3RTd2Qh8DvDWmBRAI/Sheet1",
    );

    const data = await response.json();

    const menuItems = data.map((item) => ({
      image: item.image || "",
      name: item.name || "",
      ingredients: item.ingredients
        ? item.ingredients.split(",").map((i) => i.trim())
        : [],
      price: item.price ? item.price + "₮" : "",
      kcal: item.kcal ? Number(item.kcal) : 0,
      icons: item.icons ? item.icons.split(",").map((i) => i.trim()) : [],
    }));

    console.log(menuItems);
    return menuItems;
  } catch (error) {
    console.error("ALDAA:", error);
  }
}

loadMenu();
