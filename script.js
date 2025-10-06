let digimons = [];
let awesomplete;

// Carregar JSON
fetch("digimon_data.json")
  .then(res => res.json())
  .then(data => {
    digimons = data.map(d => d.Name);
    let input = document.getElementById("search");

    // Inicializar Awesomplete
    awesomplete = new Awesomplete(input, {
      list: digimons,
      minChars: 1,
      autoFirst: true,
      filter: function(text, input) {
        let regex = new RegExp(input, "i");
        return regex.test(text);
      },
      sort: function(a, b) {
        return a.value.toLowerCase().indexOf(input.value.toLowerCase()) - 
               b.value.toLowerCase().indexOf(input.value.toLowerCase());
      }
    });

    // Quando selecionar uma sugestão
    input.addEventListener("awesomplete-selectcomplete", function() {
      buscarDigimon(); // já busca automaticamente
    });
  });

function buscarDigimon() {
  const nome = document.getElementById("search").value.toLowerCase();
  const resultadoDiv = document.getElementById("resultado");
  resultadoDiv.innerHTML = "";

  fetch("digimon_data.json")
    .then(res => res.json())
    .then(data => {
      const encontrado = data.find(d => d.Name.toLowerCase() === nome);
      if (encontrado) {
        resultadoDiv.innerHTML = `
          <h2>${encontrado.Name}</h2>
          <p><b>Atributo:</b> ${encontrado.Attribute}</p>
          <p><b>Evoluções:</b> ${encontrado.Evolutions.join(", ")}</p>
        `;
      } else {
        resultadoDiv.innerHTML = "<p>Nenhum Digimon encontrado.</p>";
      }
    });
}
