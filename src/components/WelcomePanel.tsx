
import React from 'react';

const WelcomePanel = () => {
  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-csae-green-600 to-csae-green-800 rounded-lg shadow-lg animate-zoom-in">
      <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB4PSIwIiB5PSIwIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSgxMzUpIj48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9IiNmZmZmZmYwNSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNwYXR0ZXJuKSIvPjwvc3ZnPg==')]"></div>
      
      <div className="relative flex flex-col items-center justify-center h-full px-8 py-12 text-white">
        <img 
          src="/lovable-uploads/6d9cba4c-ad70-4be0-a8ff-5eb1c6c2bed5.png" 
          alt="Portal CSAE Floripa Logo" 
          className="w-32 h-32 mb-8"
        />
        
        <h2 className="mb-2 text-4xl font-bold text-center">
          <span className="block">Portal CSAE Floripa</span>
          <span className="relative inline-block mt-1 text-5xl font-black text-white">
            2.0
          </span>
        </h2>
        
        <div className="max-w-xl mt-6 space-y-4 text-center">
          <p className="text-lg font-medium text-csae-green-100">
            Uma nova era para a enfermagem em Florianópolis!
          </p>
          
          <p className="text-csae-green-50">
            Desenvolvido com base nas sugestões e necessidades dos profissionais desde 2022, 
            o Portal CSAE 2.0 traz ferramentas modernas para fortalecer e valorizar o trabalho 
            essencial da enfermagem.
          </p>
          
          <p className="text-csae-green-50 mb-12">
            Agradecemos seu apoio contínuo e contribuições que tornaram esta evolução possível.
            Juntos, estamos fortalecendo a enfermagem de Florianópolis!
          </p>
        </div>
        
        <div className="absolute bottom-4 right-4">
          <div className="flex items-center px-4 py-2 space-x-2 text-sm text-white border border-white/20 rounded-full bg-white/10 backdrop-blur-sm">
            <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
            <span>Versão 2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePanel;
