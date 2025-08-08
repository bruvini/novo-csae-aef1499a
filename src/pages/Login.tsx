
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Mail, Lock, Instagram } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-csae-green-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 items-center min-h-screen">
          
          {/* Storytelling Section */}
          <div className="space-y-8 lg:pr-8">
            <div className="text-center lg:text-left">
              <img 
                src="/logo_csae.png" 
                alt="Logo CSAE Floripa" 
                className="h-16 md:h-20 w-auto mx-auto lg:mx-0 mb-8"
              />
              
              <h1 className="text-3xl md:text-4xl font-bold text-csae-green-800 mb-4 leading-tight">
                Portal CSAE Floripa 2.0: <br />
                <span className="text-csae-green-600">Tecnologia e Cuidado de Mãos Dadas</span>
              </h1>
              
              <p className="text-lg text-csae-green-700 font-medium mb-6">
                Feito por enfermeiros para enfermeiros
              </p>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-csae-green-200">
                <p className="text-gray-700 leading-relaxed mb-4">
                  Desde <strong>outubro de 2022</strong>, nossa jornada começou com um sonho: revolucionar o Processo de Enfermagem nas UBSF de Florianópolis. Criado por quem entende de cuidado, para quem transforma vidas todos os dias. 
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Esta versão 2.0 representa nossa evolução contínua, pensada especialmente para facilitar seu trabalho e potencializar o cuidado que você oferece. Porque tecnologia de verdade é aquela que serve ao humano.
                </p>
                
                <div className="bg-csae-green-100 border-l-4 border-csae-green-600 p-4 mt-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-csae-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-csae-green-800">
                        <strong>Importante:</strong> O acesso será liberado inicialmente apenas para profissionais da rede pública de saúde de Florianópolis. Os dados cadastrais serão verificados pela Gerência Técnica de Enfermagem (Elizimara Siqueira).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Login Form Section */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <Card className="shadow-xl border-csae-green-200">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl text-csae-green-800">
                  Acesse sua conta
                </CardTitle>
                <p className="text-gray-600 mt-2">
                  Entre no portal e continue transformando vidas
                </p>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-csae-green-700">
                      E-mail
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 border-csae-green-200 focus:border-csae-green-500 focus:ring-csae-green-200"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-csae-green-700">
                      Senha
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Digite sua senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 border-csae-green-200 focus:border-csae-green-500 focus:ring-csae-green-200"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-csae-green-600 transition-colors"
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                        disabled={loading}
                      />
                      <Label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                        Lembrar de mim
                      </Label>
                    </div>
                    
                    <button
                      type="button"
                      className="text-sm text-csae-green-600 hover:text-csae-green-700 hover:underline transition-colors"
                      disabled={loading}
                    >
                      Esqueci minha senha
                    </button>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-csae-green-600 hover:bg-csae-green-700 text-white py-3 text-base font-medium transition-all duration-200 transform hover:scale-[1.02]"
                    disabled={loading}
                  >
                    {loading ? 'Entrando...' : 'Entrar'}
                  </Button>

                  <div className="text-center">
                    <p className="text-gray-600 mb-3">Ainda não tem uma conta?</p>
                    <Button 
                      asChild 
                      variant="outline" 
                      className="w-full border-csae-green-600 text-csae-green-600 hover:bg-csae-green-50"
                      disabled={loading}
                    >
                      <Link to="/registrar">Cadastre-se</Link>
                    </Button>
                  </div>
                </form>

                {/* Social Links */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-center text-sm text-gray-600 mb-4">Siga-nos no Instagram</p>
                  <div className="flex justify-center space-x-4">
                    <a
                      href="https://instagram.com/enfermagemfloripa"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-csae-green-600 hover:text-csae-green-700 transition-colors text-sm"
                    >
                      <Instagram className="h-4 w-4" />
                      <span>@enfermagemfloripa</span>
                    </a>
                  </div>
                  <div className="flex justify-center space-x-6 mt-2">
                    <a
                      href="https://instagram.com/bruvini"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-500 hover:text-csae-green-600 transition-colors"
                    >
                      @bruvini
                    </a>
                    <a
                      href="https://instagram.com/portalcsaefloripa"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-500 hover:text-csae-green-600 transition-colors"
                    >
                      @portalcsaefloripa
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
